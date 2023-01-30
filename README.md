# circular-slider

This component was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.1.2.

This component is free to use.

Example screenshot:

![alt text](https://github.com/j-lafaye/ng-circular-slider/blob/main/demo/screenshot.png)

## Implementation

Import `CircularSliderModule` in parent component module.

Use it like below in parent component template:
```
<app-circular-slider
  [min]="0"
  [max]="100"
  [step]="1"
  [units]="'%'"
  [value]="sliderValue"></app-circular-slider>
```

## Customization

The component is made with ShadowDom encapsulation.
It is deliberately empty of style.

You can customize it easily with the svg attributes and css classes present in the host component elements.

For this purpose use the `circular-slider.component.html` or `circular-slider.component.css` file.
