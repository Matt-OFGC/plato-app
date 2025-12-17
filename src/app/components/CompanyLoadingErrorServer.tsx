import { CompanyLoadingErrorWrapper } from "./CompanyLoadingError";
import type { CurrentUserAndCompany } from "@/lib/current";

/**
 * Server component wrapper for CompanyLoadingError
 * Use this in server components when companyId is null
 * 
 * @example
 * ```tsx
 * // In a server component page
 * const result = await getCurrentUserAndCompany();
 * if (!result.companyId) {
 *   return <CompanyLoadingErrorServer result={result} page="dashboard" />;
 * }
 * 
 * // Now you can safely use result.companyId (it's guaranteed to be non-null)
 * const data = await fetchData(result.companyId);
 * ```
 * 
 * This component will display a user-friendly error message with:
 * - Clear explanation of the issue
 * - "Try Again" button to refresh
 * - Link to companies page
 * - Option to report the issue
 */
export function CompanyLoadingErrorServer({
  result,
  page,
  title,
  description,
}: {
  result: CurrentUserAndCompany;
  page?: string;
  title?: string;
  description?: string;
}) {
  return (
    <CompanyLoadingErrorWrapper
      currentUserAndCompany={result}
      page={page}
      title={title}
      description={description}
    />
  );
}
