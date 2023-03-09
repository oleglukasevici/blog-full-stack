import Link from "next/link";
import { useRouter } from "next/router";
import MainLayout from "@components/MainLayout";
import AuthFeedbackMessage from "@components/AuthFeedbackMessage";

export type ErrorType =
  | "default"
  | "configuration"
  | "accessdenied"
  | "verification";

interface ErrorView {
  status: number;
  heading: string;
  message: JSX.Element;
  signin?: JSX.Element;
}

const ErrorPage = () => {
  const router = useRouter();
  const error = router.query.error as ErrorType;

  const errors: Record<ErrorType, ErrorView> = {
    default: {
      status: 200,
      heading: "Error",
      message: (
        <div className="min-w-[200px]">
          <p className="mb-3">An unindentified error has occured.</p>
          <Link passHref href="/">
            <a className="font-medium underline dark:text-emerald-400 text-emerald-600 hover:text-emerald-500">
              Back to home
            </a>
          </Link>
        </div>
      ),
    },
    configuration: {
      status: 500,
      heading: "Server error",
      message: (
        <div>
          <p>There is a problem with the server configuration.</p>
          <p className="leading-8">
            Check the server logs for more information.
          </p>
        </div>
      ),
    },
    accessdenied: {
      status: 403,
      heading: "Access Denied",
      message: (
        <div>
          <p className="mb-4">You do not have permission to sign in.</p>
          <Link passHref href="/signin">
            <a className="font-medium underline dark:text-emerald-400 text-emerald-600 hover:text-emerald-500">
              Sign in
            </a>
          </Link>
        </div>
      ),
    },
    verification: {
      status: 403,
      heading: "Unable to sign in",
      message: (
        <div className="flex flex-col gap-3 text-center">
          <p>The sign in link is no longer valid.</p>
          <p>It may have been used already or it may have expired.</p>
        </div>
      ),
      signin: (
        <Link passHref className="button" href="/signin">
          <a className="font-medium underline dark:text-emerald-400 text-emerald-600 hover:text-emerald-500">
            Sign in
          </a>
        </Link>
      ),
    },
  };

  const { heading, message, signin, status } =
    errors[error?.toLowerCase() as ErrorType] ?? errors.default;

  return (
    <MainLayout>
      <div className="shadow dark:shadow-2xl dark:bg-neutral-800 pb-5 sm:pb-0">
        <AuthFeedbackMessage message={`Error - ${status}`} />
        <h1 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight mx-2 text-gray-900 dark:text-white">
          {heading}
        </h1>

        <div className="sm:p-7 p-5 text-center">
          <div>{message}</div>
          {signin && <div className="mt-5">{signin}</div>}
        </div>
      </div>
    </MainLayout>
  );
};

export default ErrorPage;
