import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { SidebarNavComponent } from './sidebar-nav.component';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

describe('SidebarNavComponent', () => {
  let fixture: ComponentFixture<SidebarNavComponent>;
  let component: SidebarNavComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNavComponent],
      providers: [provideRouter([]), PlantSelectorService],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => expect(component).toBeTruthy());

  it('starts expanded (isCollapsed = false)', () => {
    expect((component as any).isCollapsed()).toBeFalse();
  });

  // F10-03-09: toggle cambia isCollapsed
  it('toggleCollapse() toggles isCollapsed signal', () => {
    (component as any).toggleCollapse();
    expect((component as any).isCollapsed()).toBeTrue();
    (component as any).toggleCollapse();
    expect((component as any).isCollapsed()).toBeFalse();
  });

  // F10-03-08: expandido muestra textos de los links
  it('shows navigation link texts when expanded', () => {
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Emisiones');
    expect(fixture.nativeElement.textContent).toContain('Auditoria');
  });

  // F10-03-10: colapsado no muestra textos de navegacion
  it('hides navigation link texts when collapsed', () => {
    component.toggleCollapse();
    fixture.detectChanges();
    const spans = fixture.debugElement.queryAll(By.css('nav a span'));
    spans.forEach(s => expect(s.nativeElement.offsetParent).toBeNull());
  });

  // F10-03-11: link activo con routerLinkActive
  it('contains routerLinkActive directive on nav links', () => {
    const links = fixture.debugElement.queryAll(By.css('nav a[routerlinkactive]'));
    expect(links.length).toBeGreaterThan(0);
  });
});
