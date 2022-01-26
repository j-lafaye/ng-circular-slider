import { Component, ElementRef, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-circular-slider',
  templateUrl: './circular-slider.component.html',
  styleUrls: ['./circular-slider.component.scss']
})
export class CircularSliderComponent implements OnInit {
  /**
   * Inputs
   */
  @Input() circularSliderMax: number = 0;
  @Input() circularSliderMin: number = 0;
  @Input() circularSliderStep: number = 0;
  @Input() circularSliderValue: number = 0;

  /**
   * DOM Elements
   */
  private nativeElement: HTMLElement | null = null;
  private outputElement: HTMLOutputElement | null = null;
  private svgElement: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;
  private trackElement: SVGGeometryElement | null = null;
  private thumbElement: HTMLElement | null = null;

  /**
   * static members
   */
  private steps: number = 0;
  private π: number = 0;
  private isMoving: boolean = false;
  private breakpoint: any = null;
  private range: number = 0;
  private portion: number = 0;
  private portionPercentage: number = 0;

  /**
   * dynamic members
   */
  private radius: number = 0;
  private perimeter: number = 0;
  private points: any[] = [];
  private thumbPosition: any;

  constructor(
    private elementRef: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    this.steps = ((this.circularSliderMax - this.circularSliderMin) / this.circularSliderStep);
    this.π = Math.PI;
    this.isMoving = false;
    this.breakpoint = window.matchMedia('(max-width: 960px)');
    this.range = this.circularSliderMax - this.circularSliderMin;
    this.portion = this.circularSliderValue - this.circularSliderMin;
    this.portionPercentage = Math.round((this.portion / this.range) * 100);
  }

  ngAfterViewInit(): void {
    this.nativeElement = this.elementRef.nativeElement;

    if (this.nativeElement != null) {
      this.outputElement = <HTMLOutputElement> this.nativeElement.getElementsByClassName('circular-slider-output')[0];
      this.svgElement = <HTMLElement> this.nativeElement.getElementsByClassName('circular-slider-svg')[0];
      this.progressElement = <HTMLElement> this.nativeElement.getElementsByClassName('circular-slider-progress')[0];
      this.trackElement = <SVGGeometryElement> this.nativeElement.getElementsByClassName('circular-slider-track')[0];
      this.thumbElement = <HTMLElement> this.nativeElement.getElementsByClassName('circular-slider-thumb')[0];

      this.onInit();
  
      this.breakpoint.addEventListener('change', () => {
        this.onInit();
      });
      
      this.nativeElement.addEventListener('mouseup', () => {
        this.onDragEnd();
      });

      this.nativeElement.addEventListener('touchend', () => {
        this.onDragEnd();
      });

      this.svgElement.addEventListener('click', (_event: any) => {
        this.onDragStart();
        this.onChange(_event);
        this.onDragEnd();
      });

      this.svgElement.addEventListener('mousedown', () => {
        this.onDragStart();
        this.svgElement?.addEventListener('mousemove', (_event: any) => this.onChange(_event));
      });

      this.svgElement.addEventListener('touchstart', () => {
        this.onDragStart();
        this.svgElement?.addEventListener('touchmove', (_event: any) => this.onChange(_event));
      });
    }
  }

  /**
   * @returns converted degree to radian
   * -> needed to recalculate points position on rotated SVG circle progress element
   */
  private convertDegreeToRadian(_degree: number): number {
    return _degree * (this.π / 180);
  }

  /**
   * @returns available points on SVG track element
   */
  private getPoints(): any[] {
    let points: any[] = [];
    let progressLength: number = 0;
    let trackLength: number | undefined = 0;
    trackLength = this.trackElement?.getTotalLength();
    
    if (trackLength != null && trackLength != undefined) {
      const step = trackLength / this.steps;
      const center = {x: 160, y: 160};
      let DOMPoint: any = null;

      while (progressLength < trackLength + 1) {
        DOMPoint = this.trackElement?.getPointAtLength(progressLength);
        points.push({x: DOMPoint?.x.toFixed(3), y: DOMPoint?.y.toFixed(3), d: progressLength});
        progressLength += step;
      }

      points = this.getRotatedPointsPosition(points, center.x, center.y, -90);
    }
    
    return points;
  }

  /**
   * @returns recalculated points positions according to the 90 deg rotation (needed to start circular-slider at 0 o'clock)
   */
  private getRotatedPointsPosition(_actualPoints: any[], _centerX: number, _centerY: number, _angle: number): any {
      let coordinatesAfterRotation = [];
      let point: any;
      let tempX: number;
      let tempY: number;
      let rotatedX: number;
      let rotatedY: number;
      
      for (var i = 0; i < _actualPoints.length; i++) {
        point = _actualPoints[i];
        tempX = point.x - _centerX;
        tempY = point.y - _centerY;
        rotatedX = tempX * Math.cos(this.convertDegreeToRadian(_angle)) - tempY * Math.sin(this.convertDegreeToRadian(_angle));
        rotatedY = tempX * Math.sin(this.convertDegreeToRadian(_angle)) + tempY * Math.cos(this.convertDegreeToRadian(_angle));
        point.x = rotatedX + _centerX;
        point.y = rotatedY + _centerY;
        coordinatesAfterRotation.push({ 'x': point.x, 'y': point.y, 'd': point.d});
      }

      return coordinatesAfterRotation;
  }

  /**
   * @returns point according to given value
   */
  private getPoint(_pointValue: number): any {
    let index: number = 0;
    let nextValue: number = this.circularSliderMin;

    this.points.forEach((_point, _index) => {
      nextValue = nextValue + this.circularSliderStep;

      if (_pointValue >= nextValue && _pointValue <= nextValue) {
        index = _index + 1;
        return;
      }
    });

    return this.points[index];
  }

  /**
   * @returns next point according to SVG native element's click/touchmove/mousemove's position
   */
  private getClosestPoint(_x: number, _y: number): {} {
    const distances: any[] = [];

    this.points.forEach((_point, _index) => {
      const diffX = _x - _point.x;
      const diffY = _y - _point.y;
      const distance = Math.sqrt((diffX * diffX) + (diffY * diffY)).toFixed(3);
      distances.push([_index, parseFloat(distance)]);
    });

    distances.sort((a, b) => a[1] - b[1]);

    if (distances[0][0] == 0 && _x < this.points[0].x)
      return this.points[distances[1][0]]

    return this.points[distances[0][0]];
  }
  
  /**
   * @set DOM output value
   * @param _value: string;
   */
  private setOutputValue(_value: string): void {
    this.outputElement!.value = _value;
  }

  /**
   * @set DOM SVG according to media query matches
   * @param _breakpoint: any
   */
  private setSVG(_breakpoint: any): void {
    if (!_breakpoint) {
      this.svgElement?.setAttribute('width', '320');
      this.svgElement?.setAttribute('height', '320');
      this.svgElement?.setAttribute('viewBox', '0 0 320 320');
      this.trackElement?.setAttribute('r', '128');
      this.trackElement?.setAttribute('stroke-width', '16');
      this.progressElement?.setAttribute('stroke-width', '16');
      this.thumbElement?.setAttribute('stroke-width', '6');
      this.thumbElement?.setAttribute('r', '12');
      this.thumbElement?.setAttribute('cx', '160');
      this.thumbElement?.setAttribute('cy', '32');
    } else {
      this.svgElement?.setAttribute('width', '320');
      this.svgElement?.setAttribute('height', '320');
      this.svgElement?.setAttribute('viewBox', '0 0 320 320');
      this.trackElement?.setAttribute('r', '128');
      this.trackElement?.setAttribute('stroke-width', '16');
      this.progressElement?.setAttribute('stroke-width', '16');
      this.thumbElement?.setAttribute('stroke-width', '6');
      this.thumbElement?.setAttribute('r', '12');
      this.thumbElement?.setAttribute('cx', '160');
      this.thumbElement?.setAttribute('cy', '32');
    }
  }

  /**
   * @set DOM SVG path stroke dasharray according to given value
   * @param: _value: number
   */
  private setSVGPathStrokeDasharray(_value: number): void {
    this.progressElement?.setAttribute('stroke-dasharray', `${this.perimeter * _value / 100}, ${this.perimeter}`);
  }

  /**
   * @set DOM SVG thumb position
   * @param: _position: any
   */
  private setSVGThumbPosition(_position: any): void {
    this.thumbElement?.setAttribute('cx', _position.x);
    this.thumbElement?.setAttribute('cy', _position.y);
  }

  /**
   * <DOM Events>
   */
  private onDragEnd(): void {
    this.isMoving = false;
    this.svgElement?.classList.remove('moving');
  }

  private onDragStart(): void {
    this.isMoving = true;
    this.svgElement?.classList.add('moving');
  }

  private onChange(_event: any): void {
    _event.preventDefault();

    if (this.isMoving === true) {
      const rect: any = this.svgElement?.getBoundingClientRect();
      const trackLength: any = this.trackElement?.getTotalLength();
      
      if (_event.touches) { _event = _event.touches[0]; }

      if (rect != null && rect != undefined) {
        const pos: any = {
          x: (_event.clientX - rect.left).toFixed(3),
          y: (_event.clientY - rect.top).toFixed(3)
        };

        const target: any = this.getClosestPoint(parseInt(pos.x), parseInt(pos.y));
        const covered: number = target.d * 100 / trackLength;

        this.circularSliderValue = Math.round(this.circularSliderMin + this.range * (covered / 100));
        this.thumbPosition = target;

        this.setSVGThumbPosition(this.thumbPosition);
        this.setSVGPathStrokeDasharray(covered);
        this.setOutputValue(this.circularSliderValue.toString());
      }
    }
  }

  private onInit(): void {
    this.radius = this.breakpoint.matches ? 128 : 128;
    this.perimeter = this.radius * this.π * 2;
    this.points = this.getPoints();
    this.thumbPosition = this.getPoint(this.circularSliderValue);
    
    this.setSVG(this.breakpoint.matches);
    this.setSVGPathStrokeDasharray(this.portionPercentage);
    this.setSVGThumbPosition(this.thumbPosition);
    this.setOutputValue(this.circularSliderValue.toString());
  }
  /**
   * </DOM Events>
   */
}
