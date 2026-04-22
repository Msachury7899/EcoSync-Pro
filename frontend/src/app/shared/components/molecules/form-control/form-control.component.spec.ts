import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControlComponent } from './form-control.component';

describe('FormControlComponent', () => {
  let fixture: ComponentFixture<FormControlComponent>;
  let component: FormControlComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormControlComponent, ReactiveFormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(FormControlComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  // F10-03-01: muestra el label pasado por @Input
  it('renders the label passed by @Input', () => {
    component.label = 'Cantidad';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cantidad');
  });

  it('renders required asterisk when required is true', () => {
    component.label = 'Campo';
    component.required = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('*');
  });

  // F10-03-02: con FormControl invalid + touched muestra mensaje de error
  it('shows error message when control is invalid and touched', () => {
    const ctrl = new FormControl('', Validators.required);
    component.control = ctrl;
    component.label = 'Test';
    ctrl.markAsTouched();
    fixture.detectChanges();
    expect(component.showError).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('requerido');
  });

  // F10-03-03: con FormControl valid no muestra mensaje de error
  it('does not show error message when control is valid', () => {
    const ctrl = new FormControl('valor', Validators.required);
    component.control = ctrl;
    component.label = 'Test';
    ctrl.markAsTouched();
    fixture.detectChanges();
    expect(component.showError).toBeFalse();
  });

  it('does not show error when control is invalid but not touched', () => {
    const ctrl = new FormControl('', Validators.required);
    component.control = ctrl;
    fixture.detectChanges();
    expect(component.showError).toBeFalse();
  });

  it('errorMessage returns min error text', () => {
    const ctrl = new FormControl(0, [Validators.required, Validators.min(0.01)]);
    ctrl.markAsTouched();
    component.control = ctrl;
    expect(component.errorMessage).toContain('0.01');
  });
});
