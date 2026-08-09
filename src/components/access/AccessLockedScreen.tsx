import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { getReferralUrl } from "@/lib/utils";
import { resolveFirstName } from "@/lib/tooltipTokens";
import ReferralLinkField from "@/components/ReferralLinkField";

export const AccessLockedScreen = ({
  inviteCount,
  onRefresh,
}: {
  inviteCount: number;
  onRefresh: () => void;
}) => {
  const navigate = useNavigate();
  const { state, authUser } = useAppState();
  const inviteRef = useRef<HTMLDivElement | null>(null);

  const firstName = resolveFirstName({ stateUserName: state.user?.name, authUser }) || "Hi";
  const url = getReferralUrl("/", state.user?.inviteCode);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#F7F8FA] px-5 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <img src="/leadtree-logo.png" alt="Brand logo" className="mx-auto h-10 w-auto" />

        <h1 className="mt-8 text-2xl font-bold text-foreground">
          {firstName}, your access has lapsed
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Invite 5 people who join the challenge each month to keep your access free, or upgrade for
          $97/month.
        </p>

        <p className="mt-8 text-sm font-medium text-foreground">
          You have invited {inviteCount} of 5 people this month
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={[
                "h-4 w-4 rounded-full border-2",
                i < inviteCount ? "border-[#534AB7] bg-[#534AB7]" : "border-border bg-transparent",
              ].join(" ")}
            />
          ))}
        </div>

        <div ref={inviteRef} className="mt-8 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your personal invite link
          </p>
          {url ? (
            <ReferralLinkField url={url} />
          ) : (
            <p className="text-sm text-muted-foreground">Your invite link is not ready yet.</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate("/premium")}
          className="mt-8 w-full rounded-xl bg-[#534AB7] px-5 py-4 text-base font-semibold text-white"
        >
          Upgrade for $97/month
        </button>

        <button
          type="button"
          onClick={() => inviteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="mt-4 text-sm font-medium text-[#534AB7] underline underline-offset-2"
        >
          I want to invite people instead
        </button>

        <div className="mt-10">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            I have already invited 5 people, check again
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessLockedScreen;
