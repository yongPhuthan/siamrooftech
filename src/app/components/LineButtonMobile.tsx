import LineContactButton from './LineContactButton';

type LineButtonMobileProps = {
  analyticsPosition: string;
};

/**
 * Mobile-only sticky bottom LINE bar.
 *
 * The 1.25rem side padding is not cosmetic: the ads browser QA asserts the
 * button sits at least 20px inside the viewport on every breakpoint it tests.
 */
export default function LineButtonMobile({ analyticsPosition }: LineButtonMobileProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 box-border max-w-full border-t border-neutral-300 bg-white pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pl-[calc(1.25rem+env(safe-area-inset-left,0px))] pr-[calc(1.25rem+env(safe-area-inset-right,0px))] md:hidden">
      <LineContactButton analyticsPosition={analyticsPosition} fullWidth />
    </div>
  );
}
