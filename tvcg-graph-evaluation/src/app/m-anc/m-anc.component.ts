import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { DISPLAY_CONFIGURATION, ANIMATION_DURATION, ANIMATION_INCREMENT, ANIMATION_UPPER_BOUND, ANIMATION_LOWER_BOUND, MATRIX_SIZE, TRANSITION_DURATION, SVG_MARGIN, FONT_SIZE, NUMBER_OF_TIME_SLICES } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link, Cell } from '../node-link';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ReorderService } from '../reorder.service';
import { isFunction } from 'lodash';
@Component({
  selector: 'app-m-anc',
  templateUrl: './m-anc.component.html',
  styleUrls: ['./m-anc.component.scss']
})
export class MAncComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;
  private graph: Graph;
  private copyGraph: Graph;

  private matrix: Array<Cell>;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;
  private cells: d3.Selection<any, {}, any, any>;
  private highlightedRow: d3.Selection<any, {}, any, any>;
  private highlightedColumn: d3.Selection<any, {}, any, any>;

  private zoom: d3.ZoomBehavior<any, {}>;
  private zoomStartTime: number;
  private zoomEndTime: number;

  private highlightStartTime: number;
  private highlightEndTime: number;

  private timers: Array<{ type: string, time: number }>; // interaction type + time in seconds
  private interactions: { zooms: number, highlights: number, slider: number, faster: number, slower: number }; // number of zooms, drags

  private width: number;
  private height: number;

  sliderWidth: string;

  // reorder stuff
  public selectedAlgorithm: string = 'none';


  private animationHandle: any; // animation timer handler
  customAnimationSpeed: number;

  animationStarted: boolean;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4,
    ticksArray: [1, 2, 3, 4],
    translate: (value: number): string => {
      return `Time: ${value}`;
    }
  };

  constructor(private ds: DataService, public ro: ReorderService, private route: ActivatedRoute) {
    this.matrix = new Array<Cell>();
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      highlights: 0,
      slider: 0,
      faster: 0,
      slower: 0
    };

    this.sliderWidth = `${MATRIX_SIZE.WIDTH}px`;

    this.customAnimationSpeed = ANIMATION_DURATION;

    this.animationStarted = false;
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);
        this.copyGraph = { ... this.graph };

        // update slider time steps
        const newOptions: Options = Object.assign({}, this.options);

        newOptions.ticksArray = _.range(1, this.graph.nodes[0].time.length + 1);
        newOptions.ceil = NUMBER_OF_TIME_SLICES; //this.graph.nodes[0].time.length;

        this.options = newOptions;
      });
  }

  ngAfterViewInit(): void {
    this.width = (this.container.nativeElement as HTMLElement).offsetWidth;
    this.height = (this.container.nativeElement as HTMLElement).offsetHeight;

    if (this.graph) {
      this.graph.links.forEach((l: Link<Node>) => {
        let sNode = this.graph.nodes.find((n: Node) => { return n.id === l.source; });
        let tNode = this.graph.nodes.find((n: Node) => { return n.id === l.target; });
        l.source = sNode;
        l.target = tNode;
      });

      this.ro.setGraph(this.graph.nodes, this.graph.links);

      this.setup();
      this.init();
      this.render();
    }
  }

  updateOrder(): void {
    const newOrder = this.ro.reorder(this.selectedAlgorithm);

    // sort by selected ordering algorithm
    const prop: string = this.ro.properties.get(this.selectedAlgorithm);

    newOrder.sort((a: any, b: any) => {
      return a[prop] - b[prop];
    });

    this.updateMatrix(newOrder, prop);
  }

  updateMatrix(newOrder: Array<any>, prop: string): void {
    const nodesByProp = this.graph.nodes.map((n: Node) => n[prop]);

    for (let i = 0; i < this.graph.nodes.length; i++) {
      if (nodesByProp.indexOf(i) == -1) {
        // find the undefined property
        const missingNode = this.graph.nodes.find((n: Node) => n[prop] == undefined);

        if (missingNode) {
          // assign the missing property
          missingNode[prop] = i;
        } else {
          // something is duplicated
          let sortedNodes = this.graph.nodes.slice().sort((a: any, b: any) => {
            return a[prop] - b[prop];
          });

          for (let k = 0; k < sortedNodes.length - 1; k++) {
            if (sortedNodes[k][prop] === sortedNodes[k + 1][prop]) {
              sortedNodes[k + 1][prop] = i;
            }
          }
        }
      }
    }
    this.matrix = new Array<Cell>();
    let edgeHash = new Map<string, any>();
    this.graph.links
      .map((l: Link<Node>) => { return { source: l.source, target: l.target, time: l.time }; })
      .forEach((link: Link<Node>) => {
        // Undirected graph - duplicate link s-t && t-s
        let idA: string, idB: string = '';
        if (link.source === link.target) return;

        idA = `${(link.source as Node).label}-${(link.target as Node).label}`;
        idB = `${(link.target as Node).label}-${(link.source as Node).label}`;

        edgeHash.set(idA, link);
        edgeHash.set(idB, link);
      });

    if (this.selectedAlgorithm === 'none') {
      // sort nodes alphabetically    
      this.graph.nodes.sort((a: Node, b: Node) => {
        return a.label.localeCompare(b.label);
      });

      this.graph.nodes.forEach((source: Node, sourceId: number) => {
        this.graph.nodes.forEach((target: Node, targetId: number) => {
          let cell = {
            id: `${source.label}-${target.label}`,
            x: targetId,
            y: sourceId,
            link: 0,
            time: []
          };
          if (edgeHash.has(cell.id)) {
            cell.link = 1;
            cell.time = edgeHash.get(cell.id).time;
          }
          this.matrix.push(cell);
        });
      });

    } else {
      this.graph.nodes.forEach((source: Node) => {
        this.graph.nodes.forEach((target: Node) => {
          let cell = {
            id: `${source.label}-${target.label}`,
            x: source[prop],
            y: target[prop],
            link: 0,
            time: []
          };
          if (edgeHash.has(cell.id)) {
            cell.link = 1;
            cell.time = edgeHash.get(cell.id).time;
          }
          this.matrix.push(cell);
        });
      });
    }

    this.cells = this.cells.data(this.matrix);

    // CELLS
    this.cells
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('x', (d: Cell) => { return d.x * DISPLAY_CONFIGURATION.CELL_SIZE; })
      .attr('y', (d: Cell) => { return d.y * DISPLAY_CONFIGURATION.CELL_SIZE; })

    // ROWS
    const rows = this.g.selectAll('.row-label');

    rows
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('y', (d: Node, i: number) => { return (isNaN(d[prop]) ? i : d[prop]) * DISPLAY_CONFIGURATION.CELL_SIZE + DISPLAY_CONFIGURATION.CELL_SIZE; })

    // COLUMNS
    const cols = this.g.selectAll('.column-label');

    cols
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('y', (d: Node, i: number) => { return (isNaN(d[prop]) ? i : d[prop]) * DISPLAY_CONFIGURATION.CELL_SIZE + DISPLAY_CONFIGURATION.CELL_SIZE; });
  }

  restart(): void {
    this.pause();
    this.start();
  }

  pause(): void {
    this.animationStarted = false;
    clearInterval(this.animationHandle);
  }

  start(): void {
    this.animationStarted = true;
    this.animate();
  }

  faster(): void {
    if (this.customAnimationSpeed - ANIMATION_INCREMENT >= ANIMATION_LOWER_BOUND) {
      this.customAnimationSpeed -= ANIMATION_INCREMENT;
    }

    this.timers.push({
      type: 'faster',
      time: 0
    });

    this.interactions.faster++;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');

    this.restart();
  }

  slower(): void {
    if (this.customAnimationSpeed + ANIMATION_INCREMENT <= ANIMATION_UPPER_BOUND) {
      this.customAnimationSpeed += ANIMATION_INCREMENT;
    }

    this.timers.push({
      type: 'slower',
      time: 0
    });

    this.interactions.slower++;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');

    this.restart();
  }

  animate(): void {
    this.animationHandle = setInterval(this.update.bind(this), this.customAnimationSpeed);
  }

  zoomStart(): void {
    this.zoomStartTime = Date.now();
  }

  zooming($event: any): void {
    this.g.attr('transform', $event.transform);
  }

  zoomEnd(): void {
    this.zoomEndTime = Date.now();

    const zoomTime = this.zoomEndTime - this.zoomStartTime;
    this.timers.push({
      type: 'zoom',
      time: zoomTime
    });

    this.interactions.zooms++;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
  }

  mouseOver($event: MouseEvent): void {
    $event.preventDefault();

    this.highlightStartTime = Date.now();

    if (!+($event.currentTarget as SVGElement).getAttribute('fill-opacity')) return;

    d3.select(`#${($event.currentTarget as SVGElement).getAttribute('id')}`)
      .attr('fill', 'red');

    let source = ($event.currentTarget as any).id.split('-')[1];
    let target = ($event.currentTarget as any).id.split('-')[2];

    let labelFrom = ($event.currentTarget as SVGElement).getAttribute('label').split('-')[0];
    let labelTo = ($event.currentTarget as SVGElement).getAttribute('label').split('-')[1];

    // tooltip
    d3.select('#tooltip')
      .style('left', `${$event.pageX + 10}px`)
      .style('top', `${$event.pageY + 10}px`)
      .style('display', 'inline-block')
      .html(`Source: ${labelFrom}<br/>Target: ${labelTo}`);

    // row highlight
    d3.selectAll('.rows')
      .select(`#cell-${source}`)
      .attr('fill', 'red');

    // column highlight
    d3.selectAll('.columns')
      .select(`#cell-${target}`)
      .attr('fill', 'red');

    this.highlightedColumn
      .attr('fill-opacity', 0.25)
      .attr('x', ($event.currentTarget as any).x.baseVal.value)
      .attr('y', 0)
      .attr('height', ($event.currentTarget as any).y.baseVal.value);

    this.highlightedRow
      .attr('fill-opacity', 0.25)
      .attr('x', 0)
      .attr('y', ($event.currentTarget as any).y.baseVal.value)
      .attr('width', ($event.currentTarget as any).x.baseVal.value);
  }

  mouseOut($event: Event): void {
    $event.preventDefault();

    this.highlightEndTime = Date.now();

    d3.select('#tooltip')
      .style('display', 'none');

    d3.selectAll('.cell')
      .attr('fill', 'darkgray');

    d3.selectAll('text')
      .attr('fill', 'black');

    this.highlightedColumn
      .attr('fill-opacity', 0);

    this.highlightedRow
      .attr('fill-opacity', 0);

    // if(+($event.currentTarget as SVGElement).getAttribute('link')) { // log highlights only if relationships exists
    const highlightTime = this.highlightEndTime - this.highlightStartTime;
    if (highlightTime >= 200) { // log if it took more than 200ms
      this.timers.push({
        type: 'highlight',
        time: highlightTime
      });

      this.interactions.highlights++;
      parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
    }
    // }
  }

  zoomFit() {
    const bounds = (this.svgContainer.node() as any).getBBox();

    const fullWidth = this.width;
    const fullHeight = this.height;

    const width = bounds.width;
    const height = bounds.height;

    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width == 0 || height == 0) return; // nothing to fit

    const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    this.g.attr('transform', `scale(${scale}) translate(50, 50)`);
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    d3.select('#svg-container-manc')
      .append('div')
      .attr('id', 'tooltip')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('padding', '5px');

    this.svgContainer = (d3.select('#svg-container-manc') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.g = this.svgContainer.append('g')
      .attr('transform', `translate(${SVG_MARGIN.left}, ${SVG_MARGIN.top})`);


    this.highlightedRow = this.g.append('rect')
      .attr('class', 'highlighted-row')
      .attr('width', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('height', DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('fill', 'red')
      .attr('fill-opacity', 0)
      .attr('x', 0)
      .attr('y', 0)
      .attr('point-events', 'none');

    this.highlightedColumn = this.g.append('rect')
      .attr('class', 'highlighted-column')
      .attr('width', DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('height', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('fill', 'red')
      .attr('fill-opacity', 0)
      .attr('x', 0)
      .attr('y', 0)
      .attr('point-events', 'none');

    this.cells = this.g.append('g').attr('class', 'cells').selectAll('.cell');
  }

  init(): void {
    let edgeHash = new Map<string, any>();
    this.graph.links
      .map((l: Link<Node>) => { return { source: l.source, target: l.target, time: l.time }; })
      .forEach((link: Link<Node>) => {
        // Undirected graph - duplicate link s-t && t-s
        let idA: string, idB: string = '';
        if (link.source === link.target) return;

        idA = `${(link.source as Node).label}-${(link.target as Node).label}`;
        idB = `${(link.target as Node).label}-${(link.source as Node).label}`;

        edgeHash.set(idA, link);
        edgeHash.set(idB, link);
      });

    // sort nodes alphabetically    
    this.graph.nodes.sort((a: Node, b: Node) => {
      return a.label.localeCompare(b.label);
    });

    this.graph.nodes.forEach((source: Node, sourceId: number) => {
      this.graph.nodes.forEach((target: Node, targetId: number) => {
        let cell = {
          id: `${source.label}-${target.label}`,
          x: targetId,
          y: sourceId,
          link: 0,
          time: []
        };
        if (edgeHash.has(cell.id)) {
          cell.link = 1;
          cell.time = edgeHash.get(cell.id).time;
        }
        this.matrix.push(cell);
      });
    });
  }

  update($event: number): void {
    if (!this.graph) return;

    let timestep = undefined;

    if (!$event) {
      this.value = (this.value === this.options.ceil) ? 1 : this.value + 1;
      timestep = this.value
    } else {
      timestep = $event;
    }

    this.timers.push({
      type: 'slider',
      time: 0
    });

    // TODO: this depends on if play or using slider
    this.interactions.slider++;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');

    // CELLS
    this.cells
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('fill-opacity', (d: Cell) => {
        return d.link ? d.time[timestep - 1] : 0;
      });

    this.g.selectAll('.row-label')
      .attr('fill-opacity', (d: Node, i: number) => {
        return d.time[timestep - 1] ? 1 : 0.2;
      });

    this.g.selectAll('.column-label')
      .attr('fill-opacity', (d: Node, i: number) => {
        return d.time[timestep - 1] ? 1 : 0.2;
      });
  }

  render(zoom: boolean = true): void {
    this.g.selectAll('.rows').remove();
    this.g.selectAll('.columns').remove();
    this.g.selectAll('.cell').remove();

    // UPDATE
    this.cells = this.cells.data(this.matrix);

    // ENTER 
    this.cells = this.cells
      .enter()
      .append('rect')
      .attr('class', 'cell');

    // JOIN
    this.cells
      .attr('width', DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('height', DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('x', (d: Cell) => { return d.x * DISPLAY_CONFIGURATION.CELL_SIZE; })
      .attr('y', (d: Cell) => { return d.y * DISPLAY_CONFIGURATION.CELL_SIZE; })
      .attr('id', (d: Cell) => { return `cell-${d.id.replace(/[^a-zA-Z0-9\- ]/g, '')}`; })
      .attr('label', (d: Cell) => { return d.id; })
      .attr('link', (d: Cell) => { return d.link ? 1 : 0; })
      .attr('fill-opacity', (d: Cell) => {
        return d.link ? d.time[0] : 0;
      })
      .attr('fill', 'darkgray')
      .attr('stroke', '#999')
      .attr('stroke-width', '1px')
      .attr('stroke-opacity', .25)
      .merge(this.cells)
      .on('mouseover', this.mouseOver.bind(this))
      .on('mouseout', this.mouseOut.bind(this));

    // EXIT
    this.cells.selectAll('.cell').remove();

    // ROWS
    this.g.append('g')
      .attr('class', 'rows')
      .selectAll('text')
      .data(this.graph.nodes)
      .enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('id', (d: Node) => { return `row-${d.label}`; })
      .attr('y', (d: Node, i: number) => {
        return i * DISPLAY_CONFIGURATION.CELL_SIZE + DISPLAY_CONFIGURATION.CELL_SIZE;
      })
      .text((d: Node) => { return d.label; })
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE);

    // COLUMNS
    this.g.append('g')
      .attr('class', 'columns')
      .selectAll('text')
      .data(this.graph.nodes)
      .enter()
      .append('text')
      .attr('class', 'column-label')
      .attr('id', (d: Node) => { return `col-${d.label}`; })
      .attr('transform', 'rotate(-90)') // Due to rotation X is now Y
      .attr('y', (d: Node, i: number) => {
        return i * DISPLAY_CONFIGURATION.CELL_SIZE + DISPLAY_CONFIGURATION.CELL_SIZE;
      })
      .text((d: Node) => { return d.label; })
      .attr('text-anchor', 'start')
      .attr('font-size', FONT_SIZE);

    this.g.selectAll('.row-label')
      .attr('fill-opacity', (d: Node, i: number) => {
        return d.time[0] ? 1 : 0.2;
      });

    this.g.selectAll('.column-label')
      .attr('fill-opacity', (d: Node, i: number) => {
        return d.time[0] ? 1 : 0.2;
      });

    if (zoom) this.zoomFit();
  }
}
