import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, NODE_SIZE, LINK_LENGTH, ANIMATION_DURATION } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link } from '../node-link';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-nl-an',
  templateUrl: './nl-an.component.html',
  styleUrls: ['./nl-an.component.scss']
})

export class NlAnComponent implements OnInit {
  
  @HostListener('window:beforeunload', ['$event']) beforeUnloadHandler($event: Event) {
      console.log($event);
      window.alert('Hi');

      this.end();
  }

  private graph: Graph;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;

  private nodes: d3.Selection<any, {}, any, any>;
  private links: d3.Selection<any, {}, any, any>;

  private simulation: d3.Simulation<Node, Link<Node>>;

  private surveyId: string;

  private startTime: number;

  private timers: Array<{ type: string, time: number }>; // interaction type + time in seconds
  private interactions: { zooms: number, drags: number }; // number of zooms, drags

  value: number = 1;

  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService, private route: ActivatedRoute, private http: HttpClient) { }

  end(): void {
    const endTime = Date.now();

    const time = endTime - this.startTime;
    // Push to mLab
    this.http.post('http://localhost:8080/api/results', { survey: this.surveyId, time: time });
  }

  ngOnInit(): void {
    this.startTime = Date.now();

    this.route.queryParams
      .subscribe(params => {
        const graph = params['graph'];
        
        this.surveyId = params['survey'];

        this.graph = this.ds.getGraph(graph);

        if(this.graph) {
          this.setup();
          this.init();
        }
      });
  }

  setup(): void {
    this.svgContainer = (d3.select('#svg-container-nlan') as any)
                          .append('svg')
                          .attr('viewBox', [0, 0, WIDTH, HEIGHT])
                          .attr('width', WIDTH)
                          .attr('height', HEIGHT);

    this.g = this.svgContainer.append('g');

    this.simulation = d3.forceSimulation<Node>(this.graph.nodes)
                        .force('link', d3.forceLink<Node, Link<Node>>(this.graph.links).distance(LINK_LENGTH).strength(.25).id(d => d.id))
                        .force('collide', d3.forceCollide().strength(0.25).radius(NODE_SIZE*2))
                        .force('charge', d3.forceManyBody().strength(-100))
                        .force('center', d3.forceCenter(WIDTH/2, HEIGHT/2).strength(.25))
                        .velocityDecay(0.5)
                        .alphaMin(0.3);

    this.simulation.on('tick', () => { 
      this.render();
    });

    // Compute Simulation Based on SUPERGRAPH 💪
    this.simulation.alphaTarget(0.3).restart();

    this.nodes = this.g.append('g').attr('class', 'nodes').selectAll('.node');
    this.links = this.g.append('g').attr('class', 'links').selectAll('.link');
  }

  update($event: number): void {
    if(!this.graph) return;

    const nodesOutOfCurrentTime = new Set<string>();

    this.nodes
      .selectAll('circle')
      .transition()
      .duration(ANIMATION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('opacity', (d: any) => { 
        if(d.time !== $event) nodesOutOfCurrentTime.add(d.label);
        return d.time === $event ? 1 :  0;
      });

      this.nodes
      .selectAll('text')
      .transition()
      .duration(ANIMATION_DURATION)
      .ease(d3.easeCubicOut)
      .attr('opacity', (d: any) => { 
        if(d.time !== $event) nodesOutOfCurrentTime.add(d.label);
        return d.time === $event ? 1 :  0;
      });

      this.links
        .transition()
        .duration(ANIMATION_DURATION)
        .ease(d3.easeCubicOut)
        .attr('opacity', (d: any) => { 
          return nodesOutOfCurrentTime.has(d.source.label) || nodesOutOfCurrentTime.has(d.target.label) ? 0 : 1;
        });
  }

  init(): void {
    console.log(this.graph.nodes);
    // UPDATE
    this.nodes = this.nodes.data(this.graph.nodes);
  
    // ENTER
    this.nodes = this.nodes
    .enter()
    .append('g')
    .attr('class', 'node');
    
    this.nodes
    .append('circle')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .attr('r', NODE_SIZE)
    .attr('cx', (d: any) => { return d.x; })
    .attr('cy', (d: any) => { return d.y; })
    .attr('fill', 'darkgray');

    this.nodes.append('text')
    .text((d: any) => { return d.label; })
    .attr('x', (d: any) => { return d.x + NODE_SIZE; })
    .attr('y', (d: any) => { return d.y + NODE_SIZE; });

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
      .attr('stroke-opacity', (d: any) => {
        return 1
      })
      .attr('stroke-width', (d: any) => { return 1; });

    // JOIN
    this.links = this.links
      .merge(this.links);

    // EXIT
    this.links.exit().remove();
  }

  render(): void {
    this.links
    .attr('x1', (d: any) => { return d.source.x; })
    .attr('y1', (d: any) => { return d.source.y; })
    .attr('x2', (d: any) => { return d.target.x; })
    .attr('y2', (d: any) => { return d.target.y; });

    this.nodes.selectAll('circle')
      .attr('cx', (d: any) => { return d.x; })
      .attr('cy', (d: any) => { return d.y; });

    this.nodes.selectAll('text')
      .attr('x', (d: any) => { return d.x + NODE_SIZE; })
      .attr('y', (d: any) => { return d.y + NODE_SIZE; });
  }
}
function unloadHandler() {
  throw new Error('Function not implemented.');
}

