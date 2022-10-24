import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { DISPLAY_CONFIGURATION, MATRIX_SIZE, ANIMATION_DURATION, ANIMATION_INCREMENT, ANIMATION_UPPER_BOUND, ANIMATION_LOWER_BOUND, TRANSITION_DURATION, SVG_MARGIN, FONT_SIZE } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link, Cell } from '../node-link';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-m-an',
  templateUrl: './m-an.component.html',
  styleUrls: ['./m-an.component.scss']
})
export class MAnComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;
  private graph: Graph;
  private interactionSwitch: boolean;

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
  private interactions: { zooms: number, highlights: number, faster: number, slower: number }; // number of zooms, drags

  private width: number;
  private height: number;

  private time: number;
  private animationHandle: any; // animation timer handler
  customAnimationSpeed: number;

  animationStarted: boolean;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService, private route: ActivatedRoute) {
    this.matrix = new Array<Cell>();
    this.time = 1; // start from timestep t1
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      highlights: 0,
      faster: 0,
      slower: 0
    };
    this.interactionSwitch = false;
    this.customAnimationSpeed = ANIMATION_DURATION;

    this.animationStarted = false;
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);
        this.interactionSwitch = params['interactions'] === 'true' ? true : false;
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

      this.setup();
      this.init();
    }
  }

  restart(): void {
    this.stop();
    this.start();
  }

  stop(): void {
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
    if (!this.interactionSwitch) return;

    this.zoomStartTime = Date.now();
  }

  zooming($event: any): void {
    if (!this.interactionSwitch) return;

    this.g.attr('transform', $event.transform);
  }

  zoomEnd(): void {
    if (!this.interactionSwitch) return;

    this.zoomEndTime = Date.now();

    const zoomTime = this.zoomEndTime - this.zoomStartTime;
    this.timers.push({
      type: 'zoom',
      time: zoomTime
    });

    this.interactions.zooms++;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
  }

  mouseOver($event: Event): void {
    if (!this.interactionSwitch) return; // no interaction for you

    $event.preventDefault();

    this.highlightStartTime = Date.now();

    // if (!+($event.currentTarget as SVGElement).getAttribute('link')) return;

    d3.select(($event.currentTarget as any))
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR);

    let source = ($event.currentTarget as any).id.split('-')[0];
    let target = ($event.currentTarget as any).id.split('-')[1];

    // row highlight
    d3.selectAll('.rows')
      .select(`#${source}`)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR);

    // column highlight
    d3.selectAll('.columns')
      .select(`#${target}`)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR);

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
    if (!this.interactionSwitch) return; // no interaction for you

    $event.preventDefault();

    this.highlightEndTime = Date.now();

    d3.selectAll('.cell')
      .attr('fill', 'darkgray');

    d3.selectAll('text')
      .attr('fill', 'black');

    this.highlightedColumn
      .attr('fill-opacity', 0);

    this.highlightedRow
      .attr('fill-opacity', 0);

    // if (+($event.currentTarget as SVGElement).getAttribute('link')) { // log highlights only if relationships exists
      const highlightTime = this.highlightEndTime - this.highlightStartTime;
      if(highlightTime >= 200) { // only highlight events that took longer than 250ms to complete
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

    this.g.attr('transform', `scale(${scale}) translate(50, 80)`);
}

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.svgContainer = (d3.select('#svg-container-man') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.g = this.svgContainer.append('g')
      .attr('transform', `translate(${SVG_MARGIN.left}, ${SVG_MARGIN.top})`);

    this.svgContainer.append('g')
      .attr('id', 'time')
      .attr('width', 200)
      .attr('height', 200);

    this.highlightedRow = this.g.append('rect')
      .attr('class', 'highlighted-row')
      .attr('width', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('height', DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR)
      .attr('fill-opacity', 0)
      .attr('x', 0)
      .attr('y', 0)
      .attr('point-events', 'none');

    this.highlightedColumn = this.g.append('rect')
      .attr('class', 'highlighted-column')
      .attr('width', DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('height', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR)
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

    this.render();
  }

  update(): void {
    if (!this.graph) return;
    
    this.time === 4 ? this.time = 1 : this.time++;

    // CELLS
    this.cells
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicIn)
      .attr('fill-opacity', (d: any) => {
        return d.link ? d.time[this.time - 1] : 0;
      });

    this.svgContainer.select('#time')
      .select('text')
      .text(`Time: T${this.time}`);
  }

  render(): void {
    this.g.selectAll('.rows').remove();
    this.g.selectAll('.columns').remove();

    this.svgContainer.select('#time')
      .append('text')
      .text('Time: T1')
      .attr('x', 0)
      .attr('y', 20)
      .attr('font-size', 24)
      .attr('font-weight', 'bold');

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
      .attr('id', (d: Cell) => { return d.id; })
      .attr('link', (d: Cell) => { return d.link ? 1 : 0; })
      .attr('fill-opacity', (d: Cell) => { return d.link ? d.time[0] : 0; })
      .attr('fill', (d: Cell) => { return 'darkgray'; })
      .attr('stroke', '#999')
      .attr('stroke-width', DISPLAY_CONFIGURATION.CELL_BORDER_SIZE)
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
      .attr('id', (d: Node) => { return d.label; })
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
      .attr('id', (d: Node) => { return d.label; })
      .attr('transform', 'rotate(-90)') // Due to rotation X is now Y
      .attr('y', (d: Node, i: number) => {
        return i * DISPLAY_CONFIGURATION.CELL_SIZE + DISPLAY_CONFIGURATION.CELL_SIZE;
      })
      .text((d: Node) => { return d.label; })
      .attr('text-anchor', 'start')
      .attr('font-size', FONT_SIZE);

      this.zoomFit();
  }
}
