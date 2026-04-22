import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InputFieldComponent } from './input-field.component';

describe('InputFieldComponent', () => {
  let fixture: ComponentFixture<InputFieldComponent>;
  let component: InputFieldComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InputFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(InputFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => expect(component).toBeTruthy());

  it('renders an input element', () => {
    const input = fixture.debugElement.query(By.css('input'));
    expect(input).toBeTruthy();
  });

  it('sets input type attribute from @Input', () => {
    component.type = 'number';
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.type).toBe('number');
  });

  it('writeValue() updates the displayed value', () => {
    component.writeValue('hello');
    fixture.detectChanges();
    expect(component.value).toBe('hello');
  });

  it('calls onChange when user types', () => {
    let captured: unknown;
    component.registerOnChange((v) => (captured = v));
    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    expect(captured).toBe('test');
  });

  it('calls onTouched when blurred', () => {
    const spy = jasmine.createSpy('touched');
    component.registerOnTouched(spy);
    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.dispatchEvent(new Event('blur'));
    expect(spy).toHaveBeenCalled();
  });
});
