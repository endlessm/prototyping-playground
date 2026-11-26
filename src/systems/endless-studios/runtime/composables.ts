// Stand-ins for app composables whose files can't run as copied: in the app, Nuxt auto-imports `useGraphQLQuery`
// and `useToast` into them, and the Vue systems build auto-imports only into .vue files. Each keeps the original's
// query or return shape, so screens answer them with the same sample data.
import { gql } from './graphql-request';
import { QueryAuth } from './graphql';
import { useGraphQLQuery, useI18n } from './nuxt-app';

// composables/useNotificationsCount.ts: the unread count, from a NOTIFICATIONS_COUNT sample (0 by default).
export function useNotificationsCount() {
  return useGraphQLQuery(
    gql`
      query NOTIFICATIONS_COUNT {
        getUnreadNotificationsCount {
          unread_notifications_count
        }
      }
    `,
    {
      transform: data => (data as { unread_notifications_count: number }).unread_notifications_count,
      auth: QueryAuth.Required,
      default: () => 0,
    },
  );
}

// composables/useBackendError.ts: the same messages; the error toast is logged instead of shown.
export function useBackendError() {
  const { t } = useI18n();
  const backendErrorMessage = (message?: string) => t('error_msg', { msg: message || t('backend_error') });
  const showBackendErrorToast = (message?: string) => console.info('[Endless Studios] error toast:', backendErrorMessage(message));
  return { backendErrorMessage, showBackendErrorToast };
}

// composables/useParentalConsentPolling.ts: a preview has no parent to answer a k-ID challenge, so nothing is polled
// and the modal stays on its challenge. The original calls useNuxtApp without importing it.
export function useParentalConsentPolling(_options: {
  enabled: unknown;
  challengeId?: unknown;
  onGranted?: () => void;
  onDenied?: () => void;
  intervalMs?: number;
}): void {}
