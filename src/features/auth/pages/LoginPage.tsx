import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input, Spinner } from "@/shared/components/ui";
import { Logo } from "@/shared/components/layout/Logo";
import { ROLE_LANDING } from "@/shared/config/navigation";
import { errorMessage } from "@/shared/lib/apiErrors";
import { useUiStore } from "@/shared/stores/uiStore";
import type { CurrentUser } from "@/shared/api/types";
import { authKeys, startLogin, verifyLogin } from "../api/authApi";

const emailSchema = z.object({
  // Normalize before validating so the value sent to the API matches what the
  // admin forms store (trimmed) and never varies by case.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your institutional email")
    .email("Enter a valid email"),
});
type EmailForm = z.infer<typeof emailSchema>;

const codeSchema = z.object({
  // The one-time code is exactly 6 digits; trim first so a pasted value with
  // surrounding whitespace still validates.
  code: z
    .string()
    .trim()
    .length(6, "The code is 6 digits")
    .regex(/^\d+$/, "Digits only"),
});
type CodeForm = z.infer<typeof codeSchema>;

type Step = "email" | "code";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  async function sendCode(targetEmail: string) {
    setFormError(null);
    await startLogin(targetEmail);
    setEmail(targetEmail);
    setStep("code");
  }

  async function onSendCode(values: EmailForm) {
    try {
      await sendCode(values.email);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  }

  async function onVerify(values: CodeForm) {
    setFormError(null);
    try {
      const session = await verifyLogin({ email, code: values.code });
      enter(session.user);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  }

  function enter(user: CurrentUser) {
    // A fresh sign-in must start clean: wipe any stale cached data and draft
    // state left behind by a previous session on this device (implicit
    // session loss without an explicit logout) before seeding the new
    // identity, so the next user never inherits the prior one's state.
    queryClient.clear();
    useUiStore.getState().resetSession();
    // Seed the /me cache so the route guard resolves immediately after login.
    queryClient.setQueryData(authKeys.me, user);
    navigate(ROLE_LANDING[user.role]);
  }

  return (
    <div className="ambient-backdrop flex min-h-screen items-center justify-center p-6">
      <Card className="w-[min(92vw,520px)] p-10">
        <Logo subtitle="Ing. de Sistemas · U. del Quindío" />

        <h1 className="mt-7 text-heading font-light tracking-[-2px] text-ink-black">
          Sign in to enroll
        </h1>
        <p className="mt-3 max-w-sm text-body text-graphite">
          Use your institutional email. We'll send a one-time code — no
          passwords.
        </p>

        {step === "email" ? (
          <form
            onSubmit={emailForm.handleSubmit(onSendCode)}
            className="mt-8 flex flex-col gap-5"
            noValidate
          >
            <Input
              label="Institutional email"
              type="email"
              autoComplete="email"
              placeholder="name@uniquindio.edu.co"
              error={emailForm.formState.errors.email?.message ?? formError ?? undefined}
              {...emailForm.register("email")}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={emailForm.formState.isSubmitting}
            >
              {emailForm.formState.isSubmitting ? <Spinner /> : "Send code"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={codeForm.handleSubmit(onVerify)}
            className="mt-8 flex flex-col gap-5"
            noValidate
          >
            <Input
              label={`One-time code sent to ${email}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              error={codeForm.formState.errors.code?.message ?? formError ?? undefined}
              {...codeForm.register("code")}
            />
            <div className="flex gap-3">
              <Button
                variant="soft"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setStep("email");
                  setFormError(null);
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={codeForm.formState.isSubmitting}
              >
                {codeForm.formState.isSubmitting ? <Spinner /> : "Verify"}
              </Button>
            </div>
            <p className="text-caption text-slate">
              Enter the 6-digit code we emailed to finish signing in.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
