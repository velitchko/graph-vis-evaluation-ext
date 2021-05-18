import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { DISPLAY_CONFIGURATION, MATRIX_SIZE, NUMBER_OF_TIME_SLICES, SVG_MARGIN, FONT_SIZE } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link, Cell } from '../node-link';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-m-jp',
  templateUrl: './m-jp.component.html',
  styleUrls: ['./m-jp.component.scss']
})
export class MJpComponent implements OnInit, AfterViewInit {
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

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService, private route: ActivatedRoute) {
    this.matrix = new Array<Cell>();
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      highlights: 0
    };
    this.interactionSwitch = false;
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


  zoomStart(): void {
    if(!this.interactionSwitch) return;

    this.zoomStartTime = Date.now();
  }

  zooming($event: any): void {
    if(!this.interactionSwitch) return;

    this.g.attr('transform', $event.transform);
  }

  zoomEnd(): void {
    if(!this.interactionSwitch) return;
    
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

    if (!+($event.currentTarget as SVGElement).getAttribute('link')) return;

    d3.selectAll(`#${($event.currentTarget as SVGElement).getAttribute('id')}`)
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

    for(let i = 1; i <= NUMBER_OF_TIME_SLICES; i++) {
      d3
        .select(`#highlighted-column-T${i}`)
        .attr('fill-opacity', 0.25)
        .attr('x', MATRIX_SIZE.WIDTH*(i-1) + ($event.currentTarget as any).x.baseVal.value)
        .attr('y', 0)
        .attr('height', ($event.currentTarget as any).y.baseVal.value);

      d3
        .select(`#highlighted-row-T${i}`)
        .attr('fill-opacity', 0.25)
        .attr('x', MATRIX_SIZE.WIDTH*(i-1))
        .attr('y', ($event.currentTarget as any).y.baseVal.value)
        .attr('width', ($event.currentTarget as any).x.baseVal.value);
    }
  }

  mouseOut($event: Event): void {
    if (!this.interactionSwitch) return; // no interaction for you

    $event.preventDefault();

    this.highlightEndTime = Date.now();

    d3.selectAll('.cell')
      .attr('fill', 'darkgray');

    d3.selectAll('text')
      .attr('fill', 'black');

    for(let i = 1; i <= NUMBER_OF_TIME_SLICES; i++) {
      d3
        .select(`#highlighted-column-T${i}`)
        .attr('fill-opacity', 0);

      d3
        .select(`#highlighted-row-T${i}`)
        .attr('fill-opacity', 0);
    }

    if (+($event.currentTarget as SVGElement).getAttribute('link')) { // log highlights only if relationships exists
      const highlightTime = this.highlightEndTime - this.highlightStartTime;
      this.timers.push({
        type: 'highlight',
        time: highlightTime
      });

      this.interactions.highlights++;
      parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
    }
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

    const scale = 0.95 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
    
    this.g
    .attr('transform', `scale(${scale}) translate(0, 100)`);
}


  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.svgContainer = (d3.select('#svg-container-mjp') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.g = this.svgContainer.append('g')
      .attr('transform', `translate(${SVG_MARGIN.left}, ${SVG_MARGIN.top})`);

    for(let i = 1; i <= NUMBER_OF_TIME_SLICES; i++) {
      this.g.append('rect')
        .attr('class', 'highlighted-row')
        .attr('id', `highlighted-row-T${i}`)
        .attr('width', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE)
        .attr('height', DISPLAY_CONFIGURATION.CELL_SIZE)
        .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR)
        .attr('fill-opacity', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('point-events', 'none');
  
      this.g.append('rect')
        .attr('class', 'highlighted-column')
        .attr('id', `highlighted-column-T${i}`)
        .attr('width', DISPLAY_CONFIGURATION.CELL_SIZE)
        .attr('height', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE)
        .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR)
        .attr('fill-opacity', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('point-events', 'none');

      this.g.append('g')
      .attr('x', 0)
      .attr('y', -50)
      .attr('transform', `translate(${(i - 1)*MATRIX_SIZE.WIDTH}, 0)`)
      .attr('id', `T${i}`)
      .attr('font-size', 24)
      .attr('font-weight', 'bold');
    }

    this.highlightedRow = this.g.selectAll('highlighted-row');
    this.highlightedColumn = this.g.selectAll('highlighted-column');
    // this.cells = this.g.append('g').attr('class', 'cells').selectAll('.cell');
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

  render(): void {
    this.g.selectAll('.rows').remove();
    this.g.selectAll('.columns').remove();

    for(let i = 1; i <= NUMBER_OF_TIME_SLICES; i++) {

      this.g.select(`#T${i}`)
      .append('text')
      .text(`Time Step: ${i}`)
      .attr('x', 0)
      .attr('y', -50);

      this.cells = this.g.select(`#T${i}`).append('g').attr('class', 'cells').selectAll('.cell');

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
        .attr('fill-opacity', (d: Cell) => { return d.link ? d.time[i] : 0;  })
        .attr('fill', (d: Cell) => { return 'darkgray'; })
        .attr('stroke', '#999')
        .attr('stroke-width', '1px')
        .attr('stroke-opacity', .25)
        .merge(this.cells)
        .on('mouseover', this.mouseOver.bind(this))
        .on('mouseout', this.mouseOut.bind(this));;

      // EXIT
      this.cells.selectAll('.cell').remove();

      // ROWS
      this.g
        .select(`#T${i}`)
        .append('g')
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
      this.g
        .select(`#T${i}`)
        .append('g')
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
    }

    this.zoomFit();
  }
}
