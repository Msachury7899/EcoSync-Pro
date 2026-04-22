import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent, Breadcrumb } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    component.title = 'Test Title';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('h1');
    expect(el.textContent).toContain('Test Title');
  });

  it('should display breadcrumbs', () => {
    component.breadcrumbs = [{ label: 'Home' }, { label: 'Page' }];
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('should not display nav when no breadcrumbs', () => {
    component.breadcrumbs = [];
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeFalsy();
  });

  it('defaults', () => {
    expect(component.title).toBe('');
    expect(component.breadcrumbs).toEqual([]);
  });
});
