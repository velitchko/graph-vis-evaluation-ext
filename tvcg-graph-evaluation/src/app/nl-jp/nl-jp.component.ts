import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { NODE_LINK_SIZE, DISPLAY_CONFIGURATION, SIMULATION_CONFIGURATION, NUMBER_OF_TIME_SLICES, JP_COL_COUNT, JP_ROW_COUNT } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link } from '../node-link';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-nl-jp',
  templateUrl: './nl-jp.component.html',
  styleUrls: ['./nl-jp.component.scss']
})

export class NlJpComponent implements OnInit, AfterViewInit {
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

  private drag: d3.DragBehavior<any, {}, any>;
  private dragStartTime: number;
  private dragEndTime: number;

  private timers: Array<{ type: string, time: number }>; // interaction type + time in seconds
  private interactions: { zooms: number, drags: number }; // number of zooms, drags

  private width: number;
  private height: number;

  private numTimeSlices = 0;
  private cnt = 0;

  public cols = JP_COL_COUNT;
  public rows = JP_ROW_COUNT;
  public timeSlices = NUMBER_OF_TIME_SLICES;

  constructor(private ds: DataService, private route: ActivatedRoute, private http: HttpClient) {
    this.timers = new Array<{ type: string, time: number }>();
    this.interactions = {
      zooms: 0,
      drags: 0
    };
  }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        this.graph = this.ds.getGraph(graph);

        this.numTimeSlices = this.graph.nodes[0].time.length;
        // this.cnt = this.numTimeSlices > NUMBER_OF_TIME_SLICES ? this.numTimeSlices : NUMBER_OF_TIME_SLICES;
        this.cnt = NUMBER_OF_TIME_SLICES;
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

  mouseOver($event: MouseEvent): void {
    let target = ($event.currentTarget as any).getAttribute('id');
    let label = ($event.currentTarget as any).getAttribute('label');

    d3.select('#tooltip')
      .style('left', $event.pageX + 10 + 'px')
      .style('top', $event.pageY + 10 + 'px')
      .style('display', 'inline-block')
      .html(`Node: ${label}`);

    d3.selectAll(`#${target}`)
      .transition()
      .duration(200)
      .attr('fill', 'red')
      .attr('r', DISPLAY_CONFIGURATION.NODE_RADIUS * 2);
  }

  mouseOut($event: MouseEvent): void {
    d3.select('#tooltip')
      .style('display', 'none');

    d3.selectAll('circle')
      .transition()
      .duration(200)
      .attr('fill', 'darkgray')
      .attr('r', DISPLAY_CONFIGURATION.NODE_RADIUS);
  }

  zoomStart(): void {
    this.zoomStartTime = Date.now();
  }

  zooming($event: any): void {
    d3.selectAll('.nodelink-container').each((d, i, nodes) => {
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

  dragStart($event: d3.D3DragEvent<SVGGElement, Node, any>): void {
    this.simulation
      .alpha(SIMULATION_CONFIGURATION.ALPHA)
      .restart();

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

  zoomFit() {
    for (let i = 1; i <= this.cnt; i++) {
      const jpWrapper = d3.select(`#jp-wrapper-${i}`);

      const bounds = (jpWrapper.node() as any).getBBox();

      const parent = (jpWrapper.node() as any).parentElement;

      const fullWidth = parent.clientWidth;
      const fullHeight = parent.clientHeight;

      const width = bounds.width;
      const height = bounds.height;

      const midX = bounds.x + width / 2;
      const midY = bounds.y + height / 2;

      if (width == 0 || height == 0) return; // nothing to fit

      const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      jpWrapper
        .transition()
        .duration(250)
        .attr('transform', `translate(${translate})scale(${scale})`);
    }
  }

  setup(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .extent([[0, 0], [this.width, this.height]])
      .on('start', this.zoomStart.bind(this))
      .on('zoom', this.zooming.bind(this))
      .on('end', this.zoomEnd.bind(this));

    this.drag = d3.drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragging.bind(this))
      .on('end', this.dragEnd.bind(this));

    d3.select('#svg-container-nljp')
      .append('div')
      .attr('id', 'tooltip')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('padding', '5px');

    for (let i = 1; i <= this.cnt; i++) {
      (d3.select('#svg-container-nljp') as any)
        .append('svg')
        // .attr('viewBox', [0, 0, this.width, this.height])
        .attr('width', this.width / 4)
        .attr('height', this.height / 2)
        .attr('id', `jp-${i}`)
        .call(this.zoom);

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

    this.simulation = d3.forceSimulation<Node>(this.graph.nodes)
      .force('link', d3.forceLink<Node, Link<Node>>(this.graph.links).distance(SIMULATION_CONFIGURATION.LINK_DISTANCE * 2).strength(SIMULATION_CONFIGURATION.LINK_STRENGTH).id(d => d.id))
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
      console.log('Simulation Ended');
      this.zoomFit();
    });

    // Compute Simulation Based on SUPERGRAPH 💪
    this.simulation.restart();
  }

  init(): void {
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

      const groupContainer = jpWrapper
        .append('g')
        .attr('class', 'nodelink-container')
        .attr('id', `nodelink-container-${i}`)

      this.links = groupContainer.append('g').attr('class', 'links').selectAll('.link');
      this.nodes = groupContainer.append('g').attr('class', 'nodes').selectAll('.node');

      // UPDATE
      this.links = this.links.data(this.graph.links);

      // ENTER
      this.links = this.links
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', 'darkgray')
        .attr('stroke-opacity', (d: Link<Node>) => { return d.time[i - 1]; })
        .attr('stroke-width', DISPLAY_CONFIGURATION.LINK_WIDTH);

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
        .attr('id', (d: Node) => { return `node-${d.label.replace(/[^a-zA-Z0-9\- ]/g, '')}`; })
        .attr('label', (d: Node) => { return d.label; })
        .attr('fill', 'darkgray')
        .on('mouseover', this.mouseOver.bind(this))
        .on('mouseout', this.mouseOut.bind(this));

      this.nodes.append('text')
        .text((d: Node) => { return d.label; })
        .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
        .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; })
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('paint-order', 'stroke')
        .attr('font-size', '4pt');

      // JOIN
      this.nodes = this.nodes
        .merge(this.nodes);

      // EXIT
      this.nodes.exit().remove();
    }
  }

  render(): void {
    for (let i = 1; i <= this.cnt; i++) {
      const jpContainer = d3.select(`#nodelink-container-${i}`);

      this.nodes = jpContainer.selectAll('.node');
      this.links = jpContainer.selectAll('.link');

      this.nodes.selectAll('text')
        .attr('opacity', (d: Node) => { return d.time[i - 1] ? 1 : 0.2; })
        .style('pointer-events', 'none')
        .attr('x', (d: Node) => { return d.x + DISPLAY_CONFIGURATION.NODE_RADIUS; })
        .attr('y', (d: Node) => { return d.y + DISPLAY_CONFIGURATION.NODE_RADIUS; });

      this.nodes.selectAll('circle')
        .attr('cx', (d: Node) => { return d.x; })
        .attr('cy', (d: Node) => { return d.y; })
        .attr('fill-opacity', (d: Node) => { return d.time[i - 1] ? 1 : 0.2 });

      this.links
        .attr('stroke-opacity', (d: Link<Node>) => { return d.time[i - 1]; })
        .attr('x1', (d: Link<Node>) => { return (d.source as Node).x; })
        .attr('y1', (d: Link<Node>) => { return (d.source as Node).y; })
        .attr('x2', (d: Link<Node>) => { return (d.target as Node).x; })
        .attr('y2', (d: Link<Node>) => { return (d.target as Node).y; });
    }
  }
}

