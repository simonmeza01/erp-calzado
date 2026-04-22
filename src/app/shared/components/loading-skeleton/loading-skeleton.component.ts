import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="space-y-3">
      @for (_ of rows(); track $index) {
        <div class="flex gap-3">
          @if (showAvatar()) {
            <div class="skeleton w-10 h-10 rounded-full flex-shrink-0"></div>
          }
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-3/4 rounded"></div>
            <div class="skeleton h-3 w-1/2 rounded"></div>
          </div>
          <div class="skeleton h-4 w-20 rounded self-center"></div>
        </div>
      }
    </div>
  `,
  imports: [],
})
export class LoadingSkeletonComponent {
  readonly count      = input(5);
  readonly showAvatar = input(false);
  readonly rows       = () => Array(this.count()).fill(0);
}
