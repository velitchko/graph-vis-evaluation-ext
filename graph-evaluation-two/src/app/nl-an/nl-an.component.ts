import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { NODE_LINK_SIZE, DISPLAY_CONFIGURATION, SIMULATION_CONFIGURATION, ANIMATION_DURATION, TRANSITION_DURATION, ANIMATION_INCREMENT, ANIMATION_UPPER_BOUND, ANIMATION_LOWER_BOUND } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link } from '../node-link';
@Component({
  selector: 'app-nl-an',
  templateUrl: './nl-an.component.html',
  styleUrls: ['./nl-an.component.scss']
})

export class NlAnComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;

  private graph: Graph;
  private interactionSwitch: boolean;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;

  private nodes: d3.Selection<any, {}, any, any>;
  private links: d3.Selection<any, {}, any, any>;

  private simulation: d3.Simulation<Node, Link<Node>>;

  private zoom: d3.ZoomBehavior<any, {}>;
  private zoomStartTime: number;
  private zoomEndTime: number;

  private drag: d3.DragBehavior<any, {}, any>;
  private dragStartTime: number;
  private dragEndTime: number;

  private timers: Array<{ type: string, time: number }>; // interaction type + time in seconds
  private interactions: { zooms: number, drags: number, faster: number, slower: number }; // number of zooms, drags

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
    this.time = 1; // start from first time frame
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      drags: 0,
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

  faster(): void {
    if (this.customAnimationSpeed - ANIMATION_INCREMENT >= ANIMATION_LOWER_BOUND) {
      this.customAnimationSpeed -= ANIMATION_INCREMENT;
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

  zoomFit() {
    const bounds = (this.svgContainer.node() as any).getBBox();

    const fullWidth = this.width;
    const fullHeight = this.height;

    const width = bounds.width;
    const height = bounds.height;

    console.log(fullWidth, width);
    console.log(fullHeight, height);

    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width == 0 || height == 0) return; // nothing to fit

    const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    console.log(scale, translate);
    this.g.attr('transform', `scale(${scale}) translate(${translate[0] - 100}, 50)`);
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.drag = d3.drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragging.bind(this))
      .on('end', this.dragEnd.bind(this));

    this.svgContainer = (d3.select('#svg-container-nlan') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.g = this.svgContainer.append('g');

    this.svgContainer.append('g')
      .attr('id', 'time')
      .attr('width', 200)
      .attr('height', 200);

    this.simulation = d3.forceSimulation<Node>(this.graph.nodes)
      .force('link', d3.forceLink<Node, Link<Node>>(this.graph.links).distance(SIMULATION_CONFIGURATION.LINK_DISTANCE).strength(SIMULATION_CONFIGURATION.LINK_STRENGTH).id(d => d.id))
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

    this.simulation.restart();

    this.nodes = this.g.append('g').attr('class', 'nodes').selectAll('.node');
    this.links = this.g.append('g').attr('class', 'links').selectAll('.link');
  }

  update(): void {
    if (!this.graph) return;

    this.time === 4 ? this.time = 1 : this.time++;

    this.nodes
      .selectAll('circle')
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut);
    // .attr('opacity', (d: any) => {
    //   if (d.time !== $event) nodesOutOfCurrentTime.add(d.label);
    //   return d.time === $event ? 1 : 0;
    // });

    this.nodes
      .selectAll('text')
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut);
    // .attr('opacity', (d: any) => {
    //   if (d.time !== $event) nodesOutOfCurrentTime.add(d.label);
    //   return d.time === $event ? 1 : 0;
    // });

    this.links
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('stroke-opacity', (d: Link<Node>) => { return d.time[this.time - 1]; });


    this.svgContainer.select('#time')
      .select('text')
      .text(`Time: T${this.time}`);
  }

  init(): void {
    this.svgContainer.select('#time')
      .append('text')
      .text('Time: T1')
      .attr('x', 0)
      .attr('y', 50)
      .attr('font-size', 24)
      .attr('font-weight', 'bold');

    // UPDATE
    this.nodes = this.nodes.data(this.graph.nodes);

    // ENTER
    this.nodes = this.nodes
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor',  () => { return this.interactionSwitch ? 'pointer' : ''; })
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
      .attr('paint-order', 'stroke');;

    // JOIN
    this.nodes = this.nodes
      .merge(this.nodes);

    // EXIT
    this.nodes.exit().remove();

    // UPDATE
    this.links = this.links.data(this.graph.links);

    // ENTER
    this.links = this.links
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', 'darkgray')
      .attr('stroke-opacity', (d: Link<Node>) => { return d.time[0]; })
      .attr('stroke-width', 1);

    // JOIN
    this.links = this.links
      .merge(this.links);

    // EXIT
    this.links.exit().remove();
  }

  render(): void {
    this.links
      .attr('x1', (d: Link<Node>) => { return (d.source as Node).x; })
      .attr('y1', (d: Link<Node>) => { return (d.source as Node).y; })
      .attr('x2', (d: Link<Node>) => { return (d.target as Node).x; })
      .attr('y2', (d: Link<Node>) => { return (d.target as Node).y; });

    this.nodes.selectAll('circle')
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; });

    this.nodes.selectAll('text')
      .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; });
  }
}

