import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
export type Point = {
  x: number;
  y: number;
  d?: number;
};

@Component({
  selector: 'app-circular-slider',
  templateUrl: './circular-slider.component.html',
  styleUrls: ['./circular-slider.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[class.moving]': 'moving',
  }
})
export class CircularSliderComponent implements AfterViewInit, OnChanges, OnInit {
  @Input() max: number = 0;
  @Input() min: number = 0;
  @Input() step: number = 0;
  @Input() units!: string;
  @Input() value: number = 0;

  @Output() onChange: EventEmitter<number> = new EventEmitter<number>();

  private _eventXDOMPosition!: string;
  private _eventYDOMPosition!: string;
  private _perimeter: number = 0;
  private _points: Point[] = [];
  private _portion: number = 0;
  private _portionPercentage: number = 0;
  private _progressElement!: HTMLElement;
  private _range: number = 0;
  private _steps: number = 0;
  private _svgDOMRect!: DOMRect;
  private _svgElement!: HTMLElement;
  private _thumbElement!: HTMLElement;
  private _thumbPosition!: Point;
  private _trackElement!: SVGGeometryElement;
  private _trackLength!: number;

  private readonly _center: Point = { x: 160, y: 160 };
  private readonly _element!: HTMLElement;
  private readonly _radius: number = 128;
  private readonly _pi: number = Math.PI;

  public moving: boolean = false;

  constructor(
    private elementRef: ElementRef
  ) {
    this._element = this.elementRef.nativeElement;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value']) {
      return;
    }
    if (this.value > this.max) {
      this.value = this.max;
    } else if (this.value < this.min) {
      this.value = this.min;
    }

    this._portion = this.value - this.min;
    this._portionPercentage = Math.round((this._portion / this._range) * 100);
    this._thumbPosition = this._getPoint(this.value);

    this._change(this._thumbPosition, this._portionPercentage);
  }

  ngOnInit(): void {
    this._svgElement = <HTMLElement> this._element.shadowRoot?.getElementById('svg');
    this._progressElement = <HTMLElement> this._element.shadowRoot?.getElementById('progress');
    this._trackElement = this._element.shadowRoot?.getElementById('track') as unknown as SVGGeometryElement;
    this._thumbElement = <HTMLElement> this._element.shadowRoot?.getElementById('thumb');

    this._element.addEventListener('mouseup', () => {
      this._onDragEnd();
    });

    this._element.addEventListener('touchend', () => {
      this._onDragEnd();
    });

    this._svgElement.addEventListener('click', (event: any) => {
      this._onDragStart();
      this._onChange(event);
      this._onDragEnd();
    });

    this._svgElement.addEventListener('mousedown', () => {
      this._onDragStart();
      this._svgElement?.addEventListener('mousemove', (event: any) => this._onChange(event));
    });

    this._svgElement.addEventListener('touchstart', () => {
      this._onDragStart();
      this._svgElement?.addEventListener('touchmove', (event: any) => this._onChange(event));
    });
  }

  ngAfterViewInit(): void {
    this._perimeter = this._radius * this._pi * 2;
    this._steps = ((this.max - this.min) / this.step);
    this.moving = false;
    this._range = this.max - this.min;
    this._portion = this.value - this.min;
    this._portionPercentage = Math.round((this._portion / this._range) * 100);
    this._svgDOMRect = this._svgElement?.getBoundingClientRect();
    this._trackLength = this._trackElement?.getTotalLength();
    this._points = this._getPoints();
    this._thumbPosition = this._getPoint(this.value);
    this._change(this._thumbPosition, this._portionPercentage);
  }

  private _change(thumbPosition: Point, pathStroke: number): void {
    if (!this._thumbElement || !this._progressElement) {
      return;
    }
    this._thumbElement.style.transform = 'translate(' + thumbPosition.x + 'px, ' + thumbPosition.y + 'px)';
    this._progressElement?.setAttribute('stroke-dasharray',
      `${this._perimeter * pathStroke / 100}, ${this._perimeter}`);
    this.onChange.emit(this.value);
  }

  private _convertDegreeToRadian(degree: number): number {
    return degree * (this._pi / 180);
  }

  private _getPoints(): Point[] {
    let points: Point[] = [];
    let progressLength: number = 0;

    if (this._trackLength == null) {
      return points;
    }

    const step = this._trackLength / this._steps;
    let DOMPoint: any = null;

    while (progressLength < this._trackLength + 1) {
      DOMPoint = this._trackElement?.getPointAtLength(progressLength);
      points.push({ x: DOMPoint?.x.toFixed(3), y: DOMPoint?.y.toFixed(3), d: progressLength });
      progressLength += step;
    }

    points = this._getRotatedPointsPosition(points, this._center.x, this._center.y, -90);

    return points;
  }

  private _getRotatedPointsPosition(currentPoints: Point[], centerX: number, centerY: number, angle: number): any {
    let coordinatesAfterRotation: Point[] = [];
    let point: Point;
    let tempX: number;
    let tempY: number;
    let rotatedX: number;
    let rotatedY: number;

    for (let i = 0; i < currentPoints.length; i++) {
      point = currentPoints[i];
      tempX = point.x - centerX;
      tempY = point.y - centerY;
      rotatedX = tempX * Math.cos(this._convertDegreeToRadian(angle)) - tempY * Math.sin(this._convertDegreeToRadian(angle));
      rotatedY = tempX * Math.sin(this._convertDegreeToRadian(angle)) + tempY * Math.cos(this._convertDegreeToRadian(angle));
      point.x = rotatedX + centerX;
      point.y = rotatedY + centerY;
      coordinatesAfterRotation.push({ 'x': point.x, 'y': point.y, 'd': point.d});
    }

    return coordinatesAfterRotation;
  }

  private _getPoint(pointValue: number): any {
    let index: number = 0;
    let nextValue: number = this.min;

    this._points.forEach((_point, _index) => {
      nextValue = nextValue + this.step;

      if (pointValue >= nextValue && pointValue <= nextValue) {
        index = _index + 1;
        return;
      }
    });

    return this._points[index];
  }

  private _getClosestPoint(x: number, y: number): Point {
    const distances: { index: number, distance: number }[] = [];

    this._points.forEach((point, index) => {
      const diffX = x - point.x;
      const diffY = y - point.y;
      const distance = Math.sqrt((diffX * diffX) + (diffY * diffY)).toFixed(3);
      distances.push({ index: index, distance: parseFloat(distance) });
    });

    distances.sort((a, b) => a.distance - b.distance);

    if (distances[0].index == 0 && x < this._points[0].x) {
      return this._points[distances[1].index];
    }

    return this._points[distances[0].index];
  }

  private _onChange(event: any): void {
    event.preventDefault();
    if (!this.moving) {
      return;
    }

    if (event.touches) {
      event = event.touches[0];
    }

    this._eventXDOMPosition = (event.clientX - this._svgDOMRect.left).toFixed(3);
    this._eventYDOMPosition = (event.clientY - this._svgDOMRect.top).toFixed(3);
    this._thumbPosition = this._getClosestPoint(parseInt(this._eventXDOMPosition), parseInt(this._eventYDOMPosition));
    this._portionPercentage = this._thumbPosition.d! * 100 / this._trackLength;
    this.value = Math.round(this.min + this._range * (this._portionPercentage / 100));
    this._change(this._thumbPosition, this._portionPercentage);
  }

  private _onDragEnd(): void {
    this.moving = false;
    this._svgElement?.classList.remove('moving');
  }

  private _onDragStart(): void {
    this.moving = true;
    this._svgElement?.classList.add('moving');
  }
}
