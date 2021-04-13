import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, CELL_SIZE, ANIMATION_DURATION, ANIMATION_INCREMENT, ANIMATION_UPPER_BOUND, ANIMATION_LOWER_BOUND, TRANSITION_DURATION, SVG_MARGIN, FONT_SIZE } from '../config';
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
  private interactions: { zooms: number, highlights: number }; // number of zooms, drags

  private width: number;
  private height: number;

  private time: number;
  private animationHandle: any; // animation timer handler
  private customAnimationSpeed: number;

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
      highlights: 0
    };
    this.interactionSwitch = false;
    this.customAnimationSpeed = ANIMATION_DURATION;
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);
        this.interactionSwitch = (params['interactions'] as boolean);
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
      console.log(this.graph.links);
      this.setup();
      this.init();
    }
  }

  restart(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    clearTimeout(this.animationHandle);
  }

  start(): void {
    this.animate();
  }

  faster(): void {
    if (this.customAnimationSpeed - ANIMATION_INCREMENT >= ANIMATION_LOWER_BOUND) {
      this.customAnimationSpeed -= ANIMATION_INCREMENT;
    }
    this.restart();
  }

  slower(): void {
    if (this.customAnimationSpeed + ANIMATION_INCREMENT <= ANIMATION_UPPER_BOUND) {
      this.customAnimationSpeed += ANIMATION_INCREMENT;
    }
    this.restart();
  }

  animate(): void {
    this.animationHandle = setTimeout(this.animate.bind(this), this.customAnimationSpeed);
    this.update(this.time);
    this.time === 4 ? this.time = 1 : this.time++;
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

  mouseOver($event: Event): void {
    if(!this.interactionSwitch) return; // no interaction for you

    $event.preventDefault();

    this.highlightStartTime = Date.now();

    if(!+($event.currentTarget as SVGElement).getAttribute('link')) return;

    d3.select(($event.currentTarget as any))
      .attr('fill', 'red');

    let source = ($event.currentTarget as any).id.split('-')[0];
    let target = ($event.currentTarget as any).id.split('-')[1];

    // row highlight
    d3.selectAll('.rows')
      .select(`#${source}`)
      .attr('fill', 'red');

    // column highlight
    d3.selectAll('.columns')
      .select(`#${target}`)
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
    if(!this.interactionSwitch) return; // no interaction for you

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

    if(+($event.currentTarget as SVGElement).getAttribute('link')) { // log highlights only if relationships exists
      const highlightTime = this.highlightEndTime - this.highlightStartTime;
      this.timers.push({
        type: 'highlight',
        time: highlightTime
      });
  
      this.interactions.highlights++;
      parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
    }
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .translateExtent([[-WIDTH, -HEIGHT], [WIDTH * 2, HEIGHT * 2]])
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

    this.g.append('g')
      .attr('id', 'time');
      

    this.highlightedRow = this.g.append('rect')
      .attr('class', 'highlighted-row')
      .attr('width', this.graph.nodes.length * CELL_SIZE)
      .attr('height', CELL_SIZE)
      .attr('fill', 'red')
      .attr('fill-opacity', 0)
      .attr('x', 0)
      .attr('y', 0)
      .attr('point-events', 'none');

    this.highlightedColumn = this.g.append('rect')
      .attr('class', 'highlighted-column')
      .attr('width', CELL_SIZE)
      .attr('height', this.graph.nodes.length * CELL_SIZE)
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

  update($event: number): void {
    // CELLS
    this.cells
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicIn)
      .attr('fill-opacity', (d: any) => {
        return d.link ? d.time[$event - 1] : 0;
      });

    this.g.select('#time')
      .select('text')
      .text(`Time: T${$event}`);
  }

  render(): void {
    this.g.selectAll('.rows').remove();
    this.g.selectAll('.columns').remove();

    this.g.select('#time')
      .append('text')
      .text('Time: T1')
      .attr('x', 0)
      .attr('y', -50);

    // UPDATE
    this.cells = this.cells.data(this.matrix);

    // ENTER 
    this.cells = this.cells
      .enter()
      .append('rect')
      .attr('class', 'cell');

    // JOIN
    this.cells
      .attr('width', CELL_SIZE)
      .attr('height', CELL_SIZE)
      .attr('x', (d: Cell) => { return d.x * CELL_SIZE; })
      .attr('y', (d: Cell) => { return d.y * CELL_SIZE; })
      .attr('id', (d: Cell) => { return d.id; })
      .attr('link', (d: Cell) => { return d.link ? 1 : 0; })
      .attr('fill-opacity', (d: Cell) => { return d.link ? d.time[0] : 0; })
      .attr('fill', (d: Cell) => { return 'darkgray'; })
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
      .attr('id', (d: Node) => { return d.label; })
      .attr('y', (d: Node, i: number) => {
        return i * CELL_SIZE + CELL_SIZE;
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
        return i * CELL_SIZE + CELL_SIZE;
      })
      .text((d: Node) => { return d.label; })
      .attr('text-anchor', 'start')
      .attr('font-size', FONT_SIZE);
  }
}
