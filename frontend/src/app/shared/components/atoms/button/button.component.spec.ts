import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // F10-02-02: variant primary aplica clase CSS de primario
  it('variant primary applies primary CSS class', () => {
    component.variant = 'primary';
    expect(component.variantClasses).toContain('var(--color-primary)');
  });

  // F10-02-02: variant secondary aplica clase CSS secundaria
  it('variant secondary applies secondary CSS class', () => {
    component.variant = 'secondary';
    expect(component.variantClasses).toContain('border');
  });

  // F10-02-03: loading=true muestra spinner Y botón queda disabled
  it('shows spinner and disables button when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    const spinner = fixture.debugElement.query(By.css('svg.animate-spin'));
    expect(spinner).toBeTruthy();
    expect(btn.nativeElement.disabled).toBeTrue();
  });

  // F10-02-04: loading=false no muestra spinner
  it('does not show spinner when loading is false', () => {
    component.loading = false;
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('svg.animate-spin'));
    expect(spinner).toBeNull();
  });

  // F10-02-05: emite clicked al hacer click sin loading
  it('emits clicked event when button is clicked and not loading', () => {
    component.loading = false;
    const spy = jasmine.createSpy('clicked');
    component.clicked.subscribe(spy);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    btn.nativeElement.click();
    expect(spy).toHaveBeenCalled();
  });

  it('does not emit clicked when disabled', () => {
    component.disabled = true;
    const spy = jasmine.createSpy('clicked');
    component.clicked.subscribe(spy);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    btn.nativeElement.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('renders with variant primary by default', () => {
    fixture.detectChanges();
    expect(component.variant).toBe('primary');
  });
});
