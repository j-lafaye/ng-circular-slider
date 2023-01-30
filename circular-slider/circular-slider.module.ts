import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircularSliderComponent } from './circular-slider.component';

@NgModule({
  declarations: [
    CircularSliderComponent
  ],
  exports: [
    CircularSliderComponent
  ],
  imports: [
    CommonModule
  ]
})
export class CircularSliderModule { }
