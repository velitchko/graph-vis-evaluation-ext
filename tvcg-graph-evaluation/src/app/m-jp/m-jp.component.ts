import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { DISPLAY_CONFIGURATION, MATRIX_SIZE, NUMBER_OF_TIME_SLICES, SVG_MARGIN, FONT_SIZE, JP_ROW_COUNT, JP_COL_COUNT } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link, Cell } from '../node-link';
import { ActivatedRoute } from '@angular/router';
import { ReorderService } from '../reorder.service';
@Component({
  selector: 'app-m-jp',
  templateUrl: './m-jp.component.html',
  styleUrls: ['./m-jp.component.scss']
})

export class MJpComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;
  private graph: Graph;

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

  private numTimeSlices = 0;
  private cnt = 0;

  // reorder stuff
  public selectedAlgorithm: string = 'none';

  public cols = JP_COL_COUNT;
  public rows = JP_ROW_COUNT;
  public timeSlices = NUMBER_OF_TIME_SLICES;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService, private ro: ReorderService, private route: ActivatedRoute) {
    this.matrix = new Array<Cell>();
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      highlights: 0
    };
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);
        console.log(this.graph)
        this.numTimeSlices = this.graph.nodes[0].time.length;
        //this.cnt = this.numTimeSlices > NUMBER_OF_TIME_SLICES ? this.numTimeSlices : NUMBER_OF_TIME_SLICES;
        this.cnt = 8;
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
    }
  }

  updateOrder(): void {
    const newOrder = this.ro.reorder(this.selectedAlgorithm);
    this.updateMatrix(newOrder);
  }

  updateMatrix(newOrder: any): void {
    this.graph.nodes.sort((a: Node, b: Node) => {
      return newOrder.indexOf(+a.id) - newOrder.indexOf(+b.id);
    });

    this.matrix = new Array<Cell>();

    this.selectedAlgorithm == 'none' ? this.init() : this.init(false);
  }

  zoomStart(): void {
    this.zoomStartTime = Date.now();
  }

  zooming($event: any): void {
    // FIXME: Fix zooming and make it constant on reordering
    d3.selectAll('.matrix-container').each((d, i, nodes) => {

      const node = d3.select(nodes[i])
      node.attr('transform', `${$event.transform}`)
        .attr('transform-origin', 'center');
    });
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

    if (!+($event.currentTarget as SVGElement).getAttribute('link')) return;

    d3.selectAll(`#${($event.currentTarget as SVGElement).getAttribute('id')}`)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR);

    let source = ($event.currentTarget as any).id.replace('cell-', '').split('-')[0];
    let target = ($event.currentTarget as any).id.replace('cell-', '').split('-')[1];
    
    // row highlight
    d3.selectAll('.rows')
      .select(`#cell-${source}`)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR);

    // column highlight
    d3.selectAll('.columns')
      .select(`#cell-${target}`)
      .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR);
    
    // tooltip
    d3.select('#tooltip')
      .style('left', `${$event.pageX + 10}px`)
      .style('top', `${$event.pageY + 10}px`)
      .style('display', 'inline-block')
      .html(`Source: ${source}<br/>Target: ${target}`);

    for (let i = 1; i <= this.cnt; i++) {
      d3 
        .select(`#highlighted-column-T${i}`)
        .attr('fill-opacity', 0.25)
        .attr('x',+($event.currentTarget as any).x.baseVal.value)
        .attr('y', 0)
        .attr('height', (_: any) => { return ($event.currentTarget as any).y.baseVal.value; });

      d3
        
        .select(`#highlighted-row-T${i}`)
        .attr('fill-opacity', 0.25)
        .attr('x', 0)
        .attr('y', (_) => {
          return ($event.currentTarget as any).y.baseVal.value;
        })
        .attr('width', ($event.currentTarget as any).x.baseVal.value);
    }
  }

  mouseOut($event: Event): void {
    $event.preventDefault();

    this.highlightEndTime = Date.now();

    d3.selectAll('.cell')
      .attr('fill', 'darkgray');

    d3.selectAll('text')
      .attr('fill', 'black');

    for (let i = 1; i <= this.cnt; i++) {
      d3
        .select(`#highlighted-column-T${i}`)
        .attr('fill-opacity', 0);

      d3
        .select(`#highlighted-row-T${i}`)
        .attr('fill-opacity', 0);
    }

    d3.select('#tooltip')
      .style('display', 'none');

    // if (+($event.currentTarget as SVGElement).getAttribute('link')) { // log highlights only if relationships exists
    const highlightTime = this.highlightEndTime - this.highlightStartTime;
    if (highlightTime >= 200) {// log if it took more than 200ms
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
    for (let i = 1; i <= this.cnt; i++) {
      const jpWrapper = d3.select(`#jp-wrapper-${i}`);
      
      const bounds = (jpWrapper.node() as any).getBBox();
      
      const parent = 	(jpWrapper.node() as any).parentElement;
      
      const fullWidth = parent.clientWidth;
      const fullHeight = parent.clientHeight;

      const width = bounds.width;
      const height = bounds.height;

      const midX = bounds.x + width/2;
      const midY = bounds.y + height/2;

      if (width == 0 || height == 0) return; // nothing to fit

      const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
      const translate = [fullWidth/2 - scale*midX, fullHeight/2 - scale*midY];

      jpWrapper
        .transition()
        .duration(250)
        .attr('transform', `translate(${translate})scale(${scale})`);
    }
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      // .translateExtent([[0, 0], [this.width, this.height]])
      .extent([[0, 0], [this.width, this.height]])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    d3.select('#svg-container-mjp')
      .append('div')
      .attr('id', 'tooltip') 
      .style('display', 'none')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('padding', '5px');

    for (let i = 1; i <= this.cnt; i++) {
      (d3.select('#svg-container-mjp') as any)
        .append('svg')
        .attr('width', this.width / 4)
        .attr('height', this.height / 2)
        // .attr('viewBox', [0, 0, this.width, this.height])
        .attr('id', `jp-${i}`)
        .call(this.zoom)


      this.svgContainer = d3.select(`#jp-${i}`);

      this.svgContainer.append('rect')
        .attr('width', this.width / 4 - 5)
        .attr('height', this.height / 2 - 5)
        .attr('x', 5)
        .attr('y', 5)
        .attr('fill', 'none')
        .attr('stroke', 'gray');

      this.svgContainer.append('g')
        .attr('class', 'jp-wrapper')
        .attr('id', `jp-wrapper-${i}`);
    }
  }

  init(sortDefault: boolean = true): void {
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
    if (sortDefault) {
      this.graph.nodes.sort((a: Node, b: Node) => {
        return a.label.localeCompare(b.label);
      });
    }

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
    d3.selectAll('.matrix-container').remove();
    d3.selectAll('.time-label').remove();

    for (let i = 1; i <= this.cnt; i++) {
      const jpWrapper = d3.select(`#jp-wrapper-${i}`);
      
      d3.select(`#jp-${i}`)
        .append('text')
        .text(`Time Step: ${i}`)
        .attr('class', 'time-label')
        .attr('x', 10)
        .attr('y', 25)
        .attr('font-size', 24)
        .attr('font-weight', 'bold');

      let groupContainer = jpWrapper.append('g')
        .attr('class', 'matrix-container')
        .attr('id', `matrix-container-${i}`);

      groupContainer.append('rect')
        .attr('class', 'highlighted-row')
        .attr('id', `highlighted-row-T${i}`)
        .attr('width', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE / 4)
        .attr('height', DISPLAY_CONFIGURATION.CELL_SIZE / 4)
        .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR)
        .attr('fill-opacity', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('point-events', 'none');

      groupContainer.append('rect')
        .attr('class', 'highlighted-column')
        .attr('id', `highlighted-column-T${i}`)
        .attr('width', DISPLAY_CONFIGURATION.CELL_SIZE / 4)
        .attr('height', this.graph.nodes.length * DISPLAY_CONFIGURATION.CELL_SIZE / 4)
        .attr('fill', DISPLAY_CONFIGURATION.ROW_COL_HIGHLIGHT_COLOR)
        .attr('fill-opacity', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('point-events', 'none');

      let cells = groupContainer.append('g').attr('class', 'cells').selectAll('.cell');

      // UPDATE
      cells = cells.data(this.matrix);

      // ENTER 
      cells = cells
        .enter()
        .append('rect')
        .attr('class', 'cell');

      // JOIN
      cells
        .attr('width', (DISPLAY_CONFIGURATION.CELL_SIZE / 4))
        .attr('height', (DISPLAY_CONFIGURATION.CELL_SIZE / 4))
        .attr('x', (d: Cell) => { return d.x * (DISPLAY_CONFIGURATION.CELL_SIZE / 4); })
        .attr('y', (d: Cell) => { return d.y * (DISPLAY_CONFIGURATION.CELL_SIZE / 4); })
        .attr('id', (d: Cell) => { return `cell-${d.id}`; })
        .attr('link', (d: Cell) => { return d.link ? 1 : 0; })
        .attr('fill-opacity', (d: Cell) => { return d.link ? d.time[i - 1] : 0; })
        .attr('fill', (d: Cell) => { return 'darkgray'; })
        .attr('stroke', '#999')
        .attr('stroke-width', '1px')
        .attr('stroke-opacity', .25)
        .merge(cells)
        .on('mouseover', this.mouseOver.bind(this))
        .on('mouseout', this.mouseOut.bind(this));;

      // EXIT
      cells.selectAll('.cell').remove();

      // ROWS
      groupContainer
        .append('g')
        .attr('class', 'rows')
        .selectAll('text')
        .data(this.graph.nodes)
        .enter()
        .append('text')
        .attr('class', 'row-label')
        .attr('id', (d: Node) => { return `row-${d.label}`; })
        .attr('y', (d: Node, i: number) => {
          return i * (DISPLAY_CONFIGURATION.CELL_SIZE / 4) + (DISPLAY_CONFIGURATION.CELL_SIZE / 4);
        })
        .text((d: Node) => { return d.label; })
        .attr('text-anchor', 'end')
        .attr('font-size', 4);

      // COLUMNS
      groupContainer
        .append('g')
        .attr('class', 'columns')
        .selectAll('text')
        .data(this.graph.nodes)
        .enter()
        .append('text')
        .attr('class', 'column-label')
        .attr('id', (d: Node) => { return `col-${d.label}`; })
        .attr('transform', 'rotate(-90)') // Due to rotation X is now Y
        .attr('y', (d: Node, i: number) => {
          return i * (DISPLAY_CONFIGURATION.CELL_SIZE / 4) + (DISPLAY_CONFIGURATION.CELL_SIZE / 4);
        })
        .text((d: Node) => { return d.label; })
        .attr('text-anchor', 'start')
        .attr('font-size', 4)

      this.zoomFit();
    }
  }
}
