import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, CELL_SIZE, ANIMATION_DURATION, SVG_MARGIN, FONT_SIZE } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link, Cell } from '../node-link';

@Component({
  selector: 'app-m-an',
  templateUrl: './m-an.component.html',
  styleUrls: ['./m-an.component.scss']
})
export class MAnComponent implements OnInit {
  private graph: Graph;

  private matrix: Array<Cell>;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService) { 
    this.matrix = new Array<Cell>();
  }

  ngOnInit(): void {
    this.graph = this.ds.getGraph('graph_one');
    if(this.graph) {
      this.setup();
      this.init();
    }
  }

  setup(): void {
    console.log('matrix setup');
    this.svgContainer = (d3.select('#svg-container-man') as any)
    .append('svg')
    .attr('viewBox', [0, 0, WIDTH, HEIGHT])
    .attr('width', WIDTH)
    .attr('height', HEIGHT);

    this.g = this.svgContainer.append('g')
                .attr('transform', `translate(${SVG_MARGIN.left}, ${SVG_MARGIN.top})`);
  }

  init(): void {
    let edgeHash = new Map<string, any>();
    this.graph.links
    .map((l: Link<Node>) => { return { source: l.source, target: l.target }; })
    .forEach((link: Link<Node>) => {
      // Undirected graph - duplicate link s-t && t-s
      let idA: string, idB: string = '';
      if(link.source === link.target) return;
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
        };
        if (edgeHash.has(cell.id)) cell.link = 1; 
        this.matrix.push(cell);
      });
    });

    this.render();
  }

  render(): void {
    this.g.selectAll('.cells').remove();
    this.g.selectAll('.rows').remove();
    this.g.selectAll('.columns').remove();

    // CELLS
    this.g.append('g')
      .attr('class', 'cells')
      .selectAll('.cells')
      .data(this.matrix)
      .enter()
      .append('rect')
      .attr('class', 'rect')
      .attr('width', CELL_SIZE)
      .attr('height', CELL_SIZE)
      .attr('x', (d: any) => { return d.x * CELL_SIZE; })
      .attr('y', (d: any) => { return d.y * CELL_SIZE; })
      .attr('fill-opacity', (d: any) => { 
        return d.link ? 1 : 0;
      })
      .attr('fill', (d: any) => { return 'darkgray'; })
      .attr('stroke', '#999')
      .attr('stroke-width', '1px')
      .attr('stroke-opacity', .1)

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
