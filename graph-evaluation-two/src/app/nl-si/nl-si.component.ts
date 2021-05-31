import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { NODE_LINK_SIZE, DISPLAY_CONFIGURATION, SIMULATION_CONFIGURATION, FONT_SIZE, NUMBER_OF_TIME_SLICES } from '../config';
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
  private legend: d3.Selection<any, {}, any, any>;

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
        this.interactionSwitch = params['interactions'] === 'true' ? true : false;
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
    if (!this.interactionSwitch) return; // no interaction for you

    this.zoomStartTime = Date.now();
  }

  zooming($event: any): void {
    if (!this.interactionSwitch) return; // no interaction for you

    this.g.attr('transform', $event.transform);
  }

  zoomEnd(): void {
    if (!this.interactionSwitch) return; // no interaction for you

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
    if (!this.interactionSwitch) return; // no interaction for you

    this.simulation
      .alpha(SIMULATION_CONFIGURATION.ALPHA)
      .restart();

    this.dragStartTime = Date.now();

    $event.subject.fx = $event.subject.x;
    $event.subject.fy = $event.subject.y;
  }

  dragging($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    if (!this.interactionSwitch) return; // no interaction for you

    $event.subject.fx = $event.x;
    $event.subject.fy = $event.y;
  }

  dragEnd($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    if (!this.interactionSwitch) return; // no interaction for you

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

  mouseOver($event: Event): void {
    if (!this.interactionSwitch) return; // no interaction for you

    const time = +($event.currentTarget as SVGElement).getAttribute('time');
    
    if(!time) return;
    
    // this.links
    //   .transition()
    //   .duration(TRANSITION_DURATION/2)
    //   .attr('stroke-opacity', (d: Link<Node>) => {
    //     return d.time[0] === time ? 1 : 0.125;
    //   });
  }

  mouseOut($event: Event): void {
    if (!this.interactionSwitch) return; // no interaction for you
    // this.links
    // .transition()
    // .duration(TRANSITION_DURATION/2)
    // .attr('stroke-opacity', 1);
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
    
    const transform = d3.zoomIdentity
    .translate(0, 50)
    .scale(scale);

    this.g
    .transition()
    .duration(0) // milliseconds
    .call(this.zoom.transform, transform);
}

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.color = d3.scaleSequential(d3.interpolateViridis).domain([1, NUMBER_OF_TIME_SLICES]);

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

    this.legend = this.svgContainer.append('g')
      .attr('class', 'legend')
      .selectAll('rect');

    this.g = this.svgContainer.append('g');

    // Linearize graph links
    const tempGraphLinks = this.graph.links;
    this.graph.links = new Array<{ source: number; target: number; time: Array<number> }>();
    tempGraphLinks.forEach((link: Link<Node>) => {
      link.time.forEach((t: number, index: number) => {
        this.graph.links.push({
          source: (link.source as number),
          target: (link.target as number),
          time: [(index + 1) * t]
        });
      });
    });

    this.simulation = d3.forceSimulation<Node>(this.graph.nodes)
      .force('link', d3.forceLink<Node, Link<Node>>(this.graph.links).distance(SIMULATION_CONFIGURATION.LINK_DISTANCE).strength(SIMULATION_CONFIGURATION.LINK_STRENGTH / NUMBER_OF_TIME_SLICES).id(d => d.id))
      .force('collide', d3.forceCollide().strength(SIMULATION_CONFIGURATION.NODE_STRENGTH).radius(DISPLAY_CONFIGURATION.NODE_RADIUS * 2))
      .force('charge', d3.forceManyBody().strength(SIMULATION_CONFIGURATION.MANYBODY_STRENGTH))
      .force('center', d3.forceCenter(NODE_LINK_SIZE.WIDTH / 2, NODE_LINK_SIZE.HEIGHT / 2).strength(SIMULATION_CONFIGURATION.CENTER_STRENGTH))
      .velocityDecay(SIMULATION_CONFIGURATION.VELOCITY_DECAY)
      .alpha(SIMULATION_CONFIGURATION.ALPHA)
      .alphaMin(SIMULATION_CONFIGURATION.ALPHA_MIN)
      .alphaDecay(SIMULATION_CONFIGURATION.ALPHA_DECAY)
      .alphaTarget(SIMULATION_CONFIGURATION.ALPHA_TARGET);

    this.simulation.on('tick', () => {
      this.render();
    });

    // Compute Simulation Based on SUPERGRAPH 💪
    this.simulation.restart();

    this.links = this.g.append('g').attr('class', 'links').selectAll('.link');
    this.nodes = this.g.append('g').attr('class', 'nodes').selectAll('.node');
  }

  init(): void {
    this.legend = this.legend.data([1]);

    this.legend = this.legend
      .enter()
      .append('g');

    for (let i = 1; i <= NUMBER_OF_TIME_SLICES; i++) {
      this.legend
        .append('rect')
        .attr('width', 50)
        .attr('height', 20)
        .attr('x', 50 * (i - 1))
        .attr('y', 0)
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
        .attr('x',  50 * (i - 1) + (FONT_SIZE * 0.8))
        .attr('y', (FONT_SIZE * 0.9));
    }

    // UPDATE
    this.links = this.links.data(this.graph.links);

    // ENTER
    this.links = this.links
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d: Link<Node>, i: number) => {
        return d.time[0] ? this.color(d.time[0]) : 'white';
      })
      .attr('stroke-opacity', 1)
      .attr('stroke-width', 2)
      .attr('time', (d: Link<Node>) => { return d.time[0]; })
      .on('mouseover', this.mouseOver.bind(this))
      .on('mouseout', this.mouseOut.bind(this));

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
      .style('cursor', () => { return this.interactionSwitch ? 'pointer' : ''; })
      .call(this.drag);

    this.nodes
      .append('circle')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('r', DISPLAY_CONFIGURATION.NODE_RADIUS)
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; })
      .attr('fill', 'darkgray');

    this.nodes.append('text')
      .text((d: Node) => { return d.label; })
      .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('paint-order', 'stroke');

    // JOIN
    this.nodes = this.nodes
      .merge(this.nodes);

    // EXIT
    this.nodes.exit().remove();
  }

  render(): void {
    this.links
      .attr('x1', (d: Link<Node>, i: number) => {
        let idx = i % 4;
        let dx = (d.target as Node).x - (d.source as Node).x;
        let dy = (d.target as Node).y - (d.source as Node).y;
        let angle = Math.atan2(dy, dx);
        return (d.source as Node).x + Math.sin(angle - Math.PI) * (idx * 2 - DISPLAY_CONFIGURATION.NODE_RADIUS / 2);
      })
      .attr('y1', (d: Link<Node>, i: number) => {
        let idx = i % 4;
        let dx = (d.target as Node).x - (d.source as Node).x;
        let dy = (d.target as Node).y - (d.source as Node).y;
        let angle = Math.atan2(dy, dx);
        return (d.source as Node).y + Math.cos(angle) * (idx * 2 - DISPLAY_CONFIGURATION.NODE_RADIUS / 2);
      })
      .attr('x2', (d: Link<Node>, i: number) => {
        let idx = i % 4;
        let dx = (d.target as Node).x - (d.source as Node).x;
        let dy = (d.target as Node).y - (d.source as Node).y;
        let angle = Math.atan2(dy, dx);
        return (d.target as Node).x + Math.sin(angle - Math.PI) * (idx * 2 - DISPLAY_CONFIGURATION.NODE_RADIUS / 2);
      })
      .attr('y2', (d: Link<Node>, i: number) => {
        let idx = i % 4;
        let dx = (d.target as Node).x - (d.source as Node).x;
        let dy = (d.target as Node).y - (d.source as Node).y;
        let angle = Math.atan2(dy, dx);
        return (d.target as Node).y + Math.cos(angle) * (idx * 2 - DISPLAY_CONFIGURATION.NODE_RADIUS / 2);
      });

    this.nodes.selectAll('circle')
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; });

    this.nodes.selectAll('text')
      .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; });
  }

}

