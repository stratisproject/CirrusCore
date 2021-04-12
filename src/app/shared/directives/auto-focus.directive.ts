import { Directive, Renderer2, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[myAutoFocus]'
})
export class AutoFocusDirective implements OnInit {

  constructor(private renderer: Renderer2, private elementRef: ElementRef) { }

  ngOnInit() {
    this.renderer.selectRootElement(this.elementRef).focus();
  }
}
