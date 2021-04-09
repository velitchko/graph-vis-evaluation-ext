import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, NODE_SIZE, LINK_LENGTH, ANIMATION_DURATION, NUMBER_OF_TIME_SLICES } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link } from '../node-link';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-nl-si',
  templateUrl: './nl-si.component.html',
  styleUrls: ['./nl-si.component.scss']
})

export class NlSiComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;

  private graph: Graph;
  private interactionSwitch: boolean;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;

  private nodes: d3.Selection<any, {}, any, any>;
  private links: d3.Selection<any, {}, any, any>;

  private simulation: d3.Simulation<Node, Link<Node>>;

  // Color Range
  private color: d3.ScaleSequential<string, never>;

  private zoom: d3.ZoomBehavior<any, {}>;
  private zoomStartTime: number;
  private zoomEndTime: number;

  private drag: d3.DragBehavior<any, {}, any>;
  private dragStartTime: number;
  private dragEndTime: number;

  private timers: Array<{ type: string, time: number }>; // interaction type + time in seconds
  private interactions: { zooms: number, drags: number }; // number of zooms, drags

  private width: number;
  private height: number;

  value: number = 1;

  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService, private route: ActivatedRoute, private http: HttpClient) {
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      drags: 0
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

  dragStart($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    this.dragStartTime = Date.now();

    $event.subject.fx = $event.subject.x;
    $event.subject.fy = $event.subject.y;

  }

  dragging($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    $event.subject.fx = $event.x;
    $event.subject.fy = $event.y;

  }

  dragEnd($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    this.dragEndTime = Date.now();

    const dragTime = this.dragEndTime - this.dragStartTime;
    this.timers.push({
      type: 'drag',
      time: dragTime
    });

    this.interactions.drags++;

    $event.subject.fx = null;
    $event.subject.fy = null;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .translateExtent([[-WIDTH, -HEIGHT], [WIDTH * 2, HEIGHT * 2]])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.color = d3.scaleSequential(d3.interpolateViridis).domain([0, NUMBER_OF_TIME_SLICES]);

    this.drag = d3.drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragging.bind(this))
      .on('end', this.dragEnd.bind(this));

    this.svgContainer = (d3.select('#svg-container-nlsi') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.g = this.svgContainer.append('g');



    this.simulation = d3.forceSimulation<Node>(this.graph.nodes)
      .force('link', d3.forceLink<Node, Link<Node>>(this.graph.links).distance(LINK_LENGTH).strength(.25).id(d => d.id))
      .force('collide', d3.forceCollide().strength(0.25).radius(NODE_SIZE * 2))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2).strength(.25))
      .velocityDecay(0.5)
      .alphaMin(0.3);

    this.simulation.on('tick', () => {
      this.render();
    });

    // Compute Simulation Based on SUPERGRAPH 💪
    this.simulation.alphaTarget(0.3).restart();

    this.links = this.g.append('g').attr('class', 'links').selectAll('.link');
    this.nodes = this.g.append('g').attr('class', 'nodes').selectAll('.node');
  }

  init(): void {
    // UPDATE
    this.links = this.links.data(this.graph.links);

    // ENTER
      this.links = this.links
        .enter()
        .append('line')
        .attr('time', (d: Link<Node>) => { return (d.source as Node).time; })
        .attr('class', 'link')
        .attr('stroke', (d: Link<Node>) => { return this.color((d.source as Node).time); })
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 2);

    // JOIN
    this.links = this.links
      .merge(this.links);

    // EXIT
    this.links.exit().remove();

    // UPDATE
    this.nodes = this.nodes.data(this.graph.nodes);

    // ENTER
    this.nodes = this.nodes
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(this.drag);

    this.nodes
      .append('circle')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('r', NODE_SIZE)
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; })
      .attr('fill', 'darkgray');

    this.nodes.append('text')
      .text((d: Node) => { return d.label; })
      .attr('x', (d: Node) => { return d.x + NODE_SIZE; })
      .attr('y', (d: Node) => { return d.y + NODE_SIZE; });

    // JOIN
    this.nodes = this.nodes
      .merge(this.nodes);

    // EXIT
    this.nodes.exit().remove();
  }

  render(): void {
      this.links
        .attr('x1', (d: Link<Node>) => { return (d.source as Node).x + (d.source as Node).time*2; })
        .attr('y1', (d: Link<Node>) => { return (d.source as Node).y + (d.source as Node).time*2; })
        .attr('x2', (d: Link<Node>) => { return (d.target as Node).x + (d.source as Node).time*2; })
        .attr('y2', (d: Link<Node>) => { return (d.target as Node).y + (d.source as Node).time*2; });
    // }

    this.nodes.selectAll('circle')
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; });

    this.nodes.selectAll('text')
      .attr('x', (d: Node) => { return d.x + NODE_SIZE; })
      .attr('y', (d: Node) => { return d.y + NODE_SIZE; });
  }
}

