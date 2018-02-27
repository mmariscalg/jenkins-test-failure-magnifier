import {Component, ElementRef} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'Monitor Pro v1.0';
  urlJenkins = 'http://localhost:8080/jenkins'; // by default

  constructor(elm: ElementRef) {
    this.urlJenkins = elm.nativeElement.getAttribute('urlJenkins');
  }
}
