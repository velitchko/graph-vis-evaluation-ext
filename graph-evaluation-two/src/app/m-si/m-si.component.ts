import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, CELL_SIZE, ANIMATION_DURATION, SVG_MARGIN, FONT_SIZE } from '../config';
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

  private matrix: Array<Cell>;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;
  private cells: d3.Selection<any, {}, any, any>;

  private width: number;
  private height: number;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService, private route: ActivatedRoute) {
    this.matrix = new Array<Cell>();
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);
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

  setup(): void {
    this.svgContainer = (d3.select('#svg-container-msi') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height);

    this.g = this.svgContainer.append('g')
      .attr('transform', `translate(${SVG_MARGIN.left}, ${SVG_MARGIN.top})`);

    this.cells = this.g.append('g').attr('class', 'cells').selectAll('.cell');
  }

  init(): void {
    let edgeHash = new Map<string, any>();
    this.graph.links
      .map((l: Link<Node>) => { return { source: l.source, target: l.target }; })
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
          time: source.time
        };
        if (edgeHash.has(cell.id)) cell.link = 1;
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

    // ENTER 
    this.cells = this.cells
      .enter()
      .append('rect')
      .attr('class', 'cell');

    // JOIN
    this.cells
      .attr('width', CELL_SIZE)
      .attr('height', CELL_SIZE)
      .attr('x', (d: any) => { return d.x * CELL_SIZE; })
      .attr('y', (d: any) => { return d.y * CELL_SIZE; })
      .attr('fill-opacity', (d: any) => { return d.link ? 1 : 0; })
      .attr('fill', (d: any) => { return 'darkgray'; })
      .attr('stroke', '#999')
      .attr('stroke-width', '1px')
      .attr('stroke-opacity', .25)
      .merge(this.cells);

    // EXIT
    this.cells.selectAll('.cell').remove();

    // ROWS
    this.g.append('g')
      .attr('class', 'rows')
      .selectAll('text')
      .data(this.graph.nodes)
      .enter()
      .append('text')
      .attr('y', (d: any, i: number) => {
        return i * CELL_SIZE + CELL_SIZE;
      })
      .text((d: any) => { return d.label; })
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE);

    // COLUMNS
    this.g.append('g')
      .attr('class', 'columns')
      .selectAll('text')
      .data(this.graph.nodes)
      .enter()
      .append('text')
      .attr('transform', 'rotate(-90)') // Due to rotation X is now Y
      .attr('y', (d: any, i: number) => {
        return i * CELL_SIZE + CELL_SIZE;
      })
      .text((d: any) => { return d.label; })
      .attr('text-anchor', 'start')
      .attr('font-size', FONT_SIZE);
  }
}
