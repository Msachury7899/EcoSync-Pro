import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SelectFieldComponent } from './select-field.component';

describe('SelectFieldComponent', () => {
  let fixture: ComponentFixture<SelectFieldComponent>;
  let component: SelectFieldComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectFieldComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  it('renders a select element', () => {
    fixture.detectChanges();
    const sel = fixture.debugElement.query(By.css('select'));
    expect(sel).toBeTruthy();
  });

  it('renders correct number of options', () => {
    component.options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
    fixture.detectChanges();
    const options = fixture.debugElement.queryAll(By.css('option'));
    expect(options.length).toBe(2);
  });

  it('renders placeholder option when provided', () => {
    component.placeholder = 'Seleccionar';
    component.options = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Seleccionar');
  });

  it('writeValue() updates selected value', () => {
    component.options = [{ value: 'x', label: 'X' }];
    component.writeValue('x');
    expect(component.value).toBe('x');
  });

  it('calls onChange when option is selected', () => {
    component.options = [{ value: 'a', label: 'Alpha' }];
    fixture.detectChanges();
    let captured = '';
    component.registerOnChange((v) => (captured = v));
    const select = fixture.debugElement.query(By.css('select')).nativeElement;
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    expect(captured).toBe('a');
  });
});
