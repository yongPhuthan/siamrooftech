import LineContactButton from './LineContactButton';

type LineButtonDesktopProps = {
  analyticsPosition: string;
};

/** Desktop-only floating LINE button, bottom-right. */
export default function LineButtonDesktop({ analyticsPosition }: LineButtonDesktopProps) {
  return (
    <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-[calc(2rem+env(safe-area-inset-right,0px))] z-40 hidden max-w-[calc(100%-4rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] md:block">
      <LineContactButton analyticsPosition={analyticsPosition} />
    </div>
  );
}
