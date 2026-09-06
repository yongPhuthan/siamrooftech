import LineContactButton from './LineContactButton';

type LineButtonDesktopProps = {
  analyticsPosition: string;
};

/**
 * Desktop-only floating LINE button, bottom-right.
 *
 * The 2rem offsets are not cosmetic: the ads browser QA asserts at least a 32px
 * gap from the bottom and right edges at desktop widths.
 */
export default function LineButtonDesktop({ analyticsPosition }: LineButtonDesktopProps) {
  return (
    <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-[calc(2rem+env(safe-area-inset-right,0px))] z-40 hidden max-w-[calc(100%-4rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] md:block">
      <LineContactButton analyticsPosition={analyticsPosition} />
    </div>
  );
}
