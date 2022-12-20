import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { NODE_LINK_SIZE, DISPLAY_CONFIGURATION, SIMULATION_CONFIGURATION, TRANSITION_DURATION, ANIMATION_DURATION, ANIMATION_INCREMENT, ANIMATION_UPPER_BOUND, ANIMATION_LOWER_BOUND } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link } from '../node-link';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';
@Component({
  selector: 'app-nl-anc',
  templateUrl: './nl-anc.component.html',
  styleUrls: ['./nl-anc.component.scss', '../app.component.scss']
})

export class NlAncComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;

  private graph: Graph;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;

  private nodes: d3.Selection<any, {}, any, any>;
  private links: d3.Selection<any, {}, any, any>;

  private simulation: d3.Simulation<Node, Link<Node>>;

  private zoom: d3.ZoomBehavior<any, {}>;
  private zoomStartTime: number;
  private zoomEndTime: number;
  private fitted: boolean = false;

  private drag: d3.DragBehavior<any, {}, any>;
  private dragStartTime: number;
  private dragEndTime: number;

  private timers: Array<{ type: string, time: number }>; // interaction type + time in seconds
  private interactions: { zooms: number, drags: number, slider: number, faster: number, slower: number }; // number of zooms, drags

  private width: number;
  private height: number;

  sliderWidth: string;

  private animationHandle: any; // animation timer handler
  customAnimationSpeed: number;

  animationStarted: boolean;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4,
    ticksArray: [],
    translate: (value: number): string => {
      return `Time: ${value}`;
    }
  };

  constructor(private ds: DataService, private route: ActivatedRoute, private http: HttpClient) {
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      drags: 0,
      slider: 0,
      faster: 0,
      slower: 0
    };
    this.sliderWidth = `${NODE_LINK_SIZE.WIDTH}px`;

    this.customAnimationSpeed = ANIMATION_DURATION;

    this.animationStarted = false;
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);

        // update slider time steps
        const newOptions: Options = Object.assign({}, this.options);

        newOptions.ticksArray = _.range(1, this.graph.nodes[0].time.length + 1);
        newOptions.ceil = this.graph.nodes[0].time.length;

        this.options = newOptions;
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
    this.pause();
    this.start();
  }

  pause(): void {
    this.animationStarted = false;
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

  mouseOver($event: MouseEvent): void {
    let target = ($event.currentTarget as any).getAttribute('id');
    let label = ($event.currentTarget as any).getAttribute('label');
    
    d3.select('#tooltip')
      .style('left', $event.pageX + 10 + 'px')
      .style('top', $event.pageY + 10 + 'px')
      .style('display', 'inline-block')
      .html(`Node: ${label}`);

    d3.select(`#${target}`)
      .transition()
      .duration(200)
      .attr('fill', 'red')
      .attr('r', DISPLAY_CONFIGURATION.NODE_RADIUS * 2);

    // find adjacent nodes and highlight
    let adjacentNodes = this.graph.links.filter((link: Link<Node>) => { 
      // console.log((link.source as Node).id, (link.target as Node).id)
      return (link.source as Node).label === label || (link.target as Node).label === label; 
    });
    adjacentNodes.forEach((link: Link<Node>) => {
      let node = (link.source as Node).label === label ? link.target : link.source;
      // if not in current time step dont return
      if ((node as Node).time[this.value - 1] === 0) return;

      d3.select(`#node-${(node as Node).label.replace(/[^a-zA-Z0-9\- ]/g, '')}`)
        .transition()
        .duration(200)
        .attr('stroke', 'red')
        .attr('stroke-width', 2);
    });
  }

  mouseOut($event: MouseEvent): void {
    d3.select('#tooltip')
      .style('display', 'none');

    d3.selectAll('circle')
      .transition()
      .duration(200)
      .attr('fill', 'darkgray')
      .attr('r', DISPLAY_CONFIGURATION.NODE_RADIUS)
      .attr('stroke', 'white')
      .attr('stroke-width', 1);
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
    // if (!$event.subject.time[this.value]) return; // if node outside of time slice dont drag

    this.simulation
      .alpha(SIMULATION_CONFIGURATION.ALPHA)
      .restart();

    this.dragStartTime = Date.now();

    $event.subject.fx = $event.subject.x;
    $event.subject.fy = $event.subject.y;
  }

  dragging($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    // if (!$event.subject.time[this.value]) return; // if node outside of time slice dont drag
    $event.subject.fx = $event.x;
    $event.subject.fy = $event.y;
  }

  dragEnd($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    if (!$event.subject.time[this.value]) return; // if node outside of time slice dont drag

    this.dragEndTime = Date.now();

    const dragTime = this.dragEndTime - this.dragStartTime;
    this.timers.push({
      type: 'drag',
      time: dragTime
    });

    this.interactions.drags++;

    // $event.subject.fx = null;
    // $event.subject.fy = null;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');
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

    this.g.attr('transform', `scale(${scale}) translate(${translate[0]-50}, ${translate[1]+150})`);
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    d3.select('#svg-container-nlanc')
      .append('div')
      .attr('id', 'tooltip')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('padding', '5px');

    this.drag = d3.drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragging.bind(this))
      // .on('end', this.dragEnd.bind(this));

    this.svgContainer = (d3.select('#svg-container-nlanc') as any)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .call(this.zoom);

    this.g = this.svgContainer.append('g');

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

    this.simulation.on('end', () => {
      console.log('simulation ended');
      
      if(!this.fitted) {
        this.fitted = true;
        // this.zoomFit();
      }
    });

    // Compute Simulation Based on SUPERGRAPH 💪
    this.simulation.restart();

    this.links = this.g.append('g').attr('class', 'links').selectAll('.link');
    this.nodes = this.g.append('g').attr('class', 'nodes').selectAll('.node');
  }

  update($event: number): void {
    if (!this.graph) return;

    this.timers.push({
      type: 'slider',
      time: 0
    });

    let timestep = undefined;

    if (!$event) {
      this.value = (this.value === this.options.ceil) ? 1 : this.value + 1;
      timestep = this.value
    } else {
      timestep = $event;
    }

    // TODO: this depends on if play or using slider
    this.interactions.slider++;

    parent.postMessage({ interactions: this.interactions, timers: this.timers }, '*');

    this.nodes
      .selectAll('circle')
      .transition()
      .attr('fill-opacity', (d: Node) => { return d.time[timestep - 1] ? 1 : 0.2 })
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut);
    // .attr('opacity', (d: any) => {
    //   if (d.time !== $event) nodesOutOfCurrentTime.add(d.label);
    //   return d.time === $event ? 1 : 0;
    // });

    this.nodes
      .selectAll('text')
      .transition()
      .attr('opacity', (d: Node) => { return d.time[timestep - 1] ? 1 : 0.2 })
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut);
    // .attr('opacity', (d: any) => {
    //   console.log(d);
    //   if (d.time !== $event) nodesOutOfCurrentTime.add(d.label);
    //   return d.time === $event ? 1 : 0;
    // });

    this.links
      // .selectAll('link')
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('stroke-opacity', (d: Link<Node>) => {
        return d.time[timestep - 1];
      });
  }

  init(): void {

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
      .attr('r', DISPLAY_CONFIGURATION.NODE_RADIUS)
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; })
      .attr('fill', 'darkgray')
      .attr('id', (d: Node) => { return `node-${d.label.replace(/[^a-zA-Z0-9\- ]/g, '')}`; })
      .attr('label', (d: Node) => { return d.label; })
      .attr('fill-opacity', (d: Node) => { return d.time[0]; })
      .on('mouseover', this.mouseOver.bind(this))
      .on('mouseout', this.mouseOut.bind(this));

    this.nodes.append('text')
      .text((d: Node) => { return d.label; })
      .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('paint-order', 'stroke')
      .attr('opacity', (d: Node) => { return d.time[0]; })
      .attr('font-size', '4pt')

    // JOIN
    this.nodes = this.nodes
      .merge(this.nodes);

    // EXIT
    this.nodes.exit().remove();

    // this.zoomFit();
  }

  render(): void {
    this.nodes.selectAll('text')
      .attr('opacity', (d: Node) => { return d.time[0] ? 1 : 0.2; })
      .style('pointer-events', 'none')
      .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
      .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; });

    this.nodes.selectAll('circle')
      .attr('fill-opacity', (d: Node) => { return d.time[0] ? 1 : 0.2 })
      .attr('cx', (d: Node) => { return d.x; })
      .attr('cy', (d: Node) => { return d.y; });

    this.links
      .attr('x1', (d: Link<Node>) => { return (d.source as Node).x; })
      .attr('y1', (d: Link<Node>) => { return (d.source as Node).y; })
      .attr('x2', (d: Link<Node>) => { return (d.target as Node).x; })
      .attr('y2', (d: Link<Node>) => { return (d.target as Node).y; });
  }
}

