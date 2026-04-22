import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  // F10-02-06: success → clases de color verde (primary)
  it('variant success returns green (primary) color classes', () => {
    component.variant = 'success';
    expect(component.variantClasses).toContain('color-primary');
  });

  // F10-02-07: danger → clases de color rojo
  it('variant danger returns red (danger) color classes', () => {
    component.variant = 'danger';
    expect(component.variantClasses).toContain('color-danger');
  });

  // F10-02-08: audited → clases de color sky
  it('variant audited returns sky (audited) color classes', () => {
    component.variant = 'audited';
    expect(component.variantClasses).toContain('color-audited');
  });

  // F10-02-09: pending → clases de color ámbar
  it('variant pending returns amber (warning) color classes', () => {
    component.variant = 'pending';
    expect(component.variantClasses).toContain('color-warning');
  });

  it('variant warning returns warning color classes', () => {
    component.variant = 'warning';
    expect(component.variantClasses).toContain('color-warning');
  });

  it('renders projected content', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span')).toBeTruthy();
  });
});
