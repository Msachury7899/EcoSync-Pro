import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;
  let component: StatCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  // F10-02-10: renderiza title, value y unit
  it('renders title, value and unit when not loading', () => {
    component.title = 'Total tCO2';
    component.value = '123';
    component.unit = 't';
    component.loading = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Total tCO2');
    expect(fixture.nativeElement.textContent).toContain('123');
    expect(fixture.nativeElement.textContent).toContain('t');
  });

  // F10-02-11: loading=true muestra skeleton
  it('shows skeleton when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const pulse = fixture.debugElement.query(By.css('.animate-pulse'));
    expect(pulse).toBeTruthy();
  });

  it('hides skeleton when loading is false', () => {
    component.loading = false;
    fixture.detectChanges();
    const pulse = fixture.debugElement.query(By.css('.animate-pulse'));
    expect(pulse).toBeNull();
  });

  // F10-02-12: tendencia positiva = verde; negativa = rojo
  it('positive trend text starts with up arrow', () => {
    component.loading = false;
    component.trend = 5;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('\u2191');
  });

  it('negative trend text starts with down arrow', () => {
    component.loading = false;
    component.trend = -3;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('\u2193');
  });

  it('does not render trend when trend is null', () => {
    component.trend = null;
    component.loading = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('\u2191');
    expect(fixture.nativeElement.textContent).not.toContain('\u2193');
  });
});
