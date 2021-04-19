import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, CELL_SIZE, NUMBER_OF_TIME_SLICES, SVG_MARGIN, FONT_SIZE } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link, Cell } from '../node-link';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-m-si',
  templateUrl: './m-si.component.html',
  styleUrls: ['./m-si.component.scss']
})
export class MSiComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;
  private graph: Graph;
  private interactionSwitch: boolean;

  private matrix: Array<Cell>;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;
  private cells: d3.Selection<any, {}, any, any>;
  private rows: d3.Selection<any, {}, any, any>;
  private columns: d3.Selection<any, {}, any, any>;
  private background: d3.Selection<any, {}, any, any>;
  private highlightedRow: d3.Selection<any, {}, any, any>;
  private highlightedColumn: d3.Selection<any, {}, any, any>;
  private legend: d3.Selection<any, {}, any, any>;

  // Color Range
  private color: d3.ScaleSequential<string, never>;

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
      this.setup();
      this.init();
    }
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
    if (!this.interactionSwitch) return; // no interaction for you

    $event.preventDefault();

    this.highlightStartTime = Date.now();

    if (!+($event.currentTarget as SVGElement).getAttribute('link')) return;

    // this.background.select(`#${($event.currentTarget as SVGElement).getAttribute('id')}`)
    //   .attr('fill', 'red');

    let source = ($event.currentTarget as any).id.split('-')[0];
    let target = ($event.currentTarget as any).id.split('-')[1];

    d3.select(`.background #${source}-${target}`)
      .attr('stroke', 'red')
      .attr('stroke-opacity', 1);

    // row highlight
    d3.selectAll('.rows')
      .select(`#${source}`)
      .attr('fill', 'red');

    // column highlight
    d3.selectAll('.columns')
      .select(`#${target}`)
      .attr('fill', 'red');

    const time = +($event.currentTarget as SVGElement).getAttribute('time');
    // console.log($event.currentTarget, time);
    // this.cells.selectAll(`[time="${time}"]`)
    //   .attr('fill-opacity', (d: Cell, i: number) => { 
    //     const idx = i % 4;
    //     return d.time[idx] === i ? 1 : 0;
    //   });

    this.highlightedColumn
      .attr('fill-opacity', 0.25)
      .attr('x', ($event.currentTarget as any).x.baseVal.value - (CELL_SIZE / NUMBER_OF_TIME_SLICES * time))
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

    this.background
      .attr('stroke', '#999')
      .attr('stroke-width', '1px')
      .attr('stroke-opacity', .25)

    this.rows.attr('fill', 'black');
    this.columns.attr('fill', 'black');

    // this.cells
    //   .attr('fill-opacity', 1);

    this.highlightedColumn
      .attr('fill-opacity', 0);

    this.highlightedRow
      .attr('fill-opacity', 0);

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


  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .translateExtent([[-WIDTH, -HEIGHT], [WIDTH * 2, HEIGHT * 2]])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.color = d3.scaleSequential(d3.interpolateViridis).domain([1, NUMBER_OF_TIME_SLICES]);

    this.svgContainer = (d3.select('#svg-container-msi') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.legend = this.svgContainer.append('g')
      .attr('class', 'legend')
      .selectAll('rect');

    this.g = this.svgContainer.append('g')
      .attr('transform', `translate(${SVG_MARGIN.left}, ${SVG_MARGIN.top})`);

    // BACKGROUND FOR BORDER
    this.background = this.g.append('g')
      .attr('class', 'background')
      .selectAll('rect');

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

  render(): void {
    this.g.selectAll('.rows').remove();
    this.g.selectAll('.columns').remove();

    // UPDATE
    this.cells = this.cells.data(this.matrix);

    this.background = this.background.data(this.matrix);

    this.background = this.background
      .enter()
      .append('rect')
      .attr('id', (d: Cell) => { return d.id; })
      .attr('x', (d: Cell) => { return d.x * CELL_SIZE; })
      .attr('y', (d: Cell) => { return d.y * CELL_SIZE; })
      .attr('width', CELL_SIZE) // stroke size * 2
      .attr('height', CELL_SIZE)
      .attr('fill', 'transparent')
      .attr('stroke', '#999')
      .attr('stroke-width', '1px')
      .attr('stroke-opacity', .25)
      .attr('pointer-events', 'none');

    // ENTER 
    this.cells = this.cells
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('width', CELL_SIZE)
      .attr('height', CELL_SIZE);

    this.legend = this.legend.data([1]);

    this.legend = this.legend
      .enter()
      .append('g');

    // JOIN
    for (let i = 1; i <= NUMBER_OF_TIME_SLICES; i++) {
      this.legend
        .append('rect')
        .attr('width', 50)
        .attr('height', 20)
        .attr('x', 50 * (i - 1))
        .attr('y', HEIGHT / 2 + SVG_MARGIN.top)
        .attr('fill-opacity', 1)
        .attr('fill', this.color(i))

      this.legend
        .append('text')
        .text(`T${i}`)
        .attr('font-size', FONT_SIZE)
        .attr('fill', 'white')
        .attr('paint-order', 'stroke')
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('x', 50 * (i - 1) + (FONT_SIZE * 0.8))
        .attr('y', HEIGHT / 2 + SVG_MARGIN.top + (FONT_SIZE * 0.9));

      this.cells
        .append('rect')
        .attr('width', (CELL_SIZE / NUMBER_OF_TIME_SLICES))
        .attr('height', CELL_SIZE)
        .attr('id', (d: Cell) => { return d.id; })
        .attr('time', i - 1)
        .attr('x', (d: Cell) => { return d.x * CELL_SIZE + (i - 1) * (CELL_SIZE / NUMBER_OF_TIME_SLICES); })
        .attr('y', (d: Cell) => { return d.y * CELL_SIZE; })
        .attr('id', (d: Cell) => { return d.id; })
        .attr('link', (d: Cell) => { return d.link ? 1 : 0; })
        .attr('fill-opacity', (d: any) => { return d.link ? 1 : 0; })
        .attr('fill', (d: Cell) => {
          const idx = d.time[i - 1] // 0 or 1 if it exists at index
          return i * idx === 0 ? 'white' : this.color(i * idx);
        })
        .merge(this.cells)
        .on('mouseover', this.mouseOver.bind(this))
        .on('mouseout', this.mouseOut.bind(this));
    }

    // EXIT
    this.cells.selectAll('.cell').remove();

    // ROWS
    this.rows = this.g.append('g')
      .attr('class', 'rows')
      .selectAll('text')
      .data(this.graph.nodes)
      .enter()
      .append('text')
      .attr('id', (d: Node) => { return d.label; })
      .attr('y', (d: any, i: number) => {
        return i * CELL_SIZE + CELL_SIZE;
      })
      .text((d: any) => { return d.label; })
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE);

    // COLUMNS
    this.columns = this.g.append('g')
      .attr('class', 'columns')
      .selectAll('text')
      .data(this.graph.nodes)
      .enter()
      .append('text')
      .attr('id', (d: Node) => { return d.label; })
      .attr('transform', 'rotate(-90)') // Due to rotation X is now Y
      .attr('y', (d: any, i: number) => {
        return i * CELL_SIZE + CELL_SIZE;
      })
      .text((d: any) => { return d.label; })
      .attr('text-anchor', 'start')
      .attr('font-size', FONT_SIZE);
  }
}
