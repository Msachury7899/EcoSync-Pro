import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let component: ConfirmationDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmationDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  it('does not render content when open is false', () => {
    component.open = false;
    fixture.detectChanges();
    const dialog = fixture.debugElement.query(By.css('.fixed'));
    expect(dialog).toBeNull();
  });

  it('renders dialog when open is true', () => {
    component.open = true;
    component.title = 'Confirmar';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Confirmar');
  });

  it('emits confirmed when confirm button is clicked', () => {
    component.open = true;
    const spy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(spy);
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('eco-button'));
    const confirmBtn = buttons.find(b => b.nativeElement.textContent.trim() === component.confirmLabel);
    confirmBtn?.nativeElement.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits cancelled when cancel button is clicked', () => {
    component.open = true;
    const spy = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(spy);
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('eco-button'));
    const cancelBtn = buttons.find(b => b.nativeElement.textContent.trim() === 'Cancelar');
    cancelBtn?.nativeElement.click();
    expect(spy).toHaveBeenCalled();
  });
});
