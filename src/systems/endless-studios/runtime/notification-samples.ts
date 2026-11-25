// Sample notifications for the component pages that show the app's notifications (Notifications/List.vue and the
// Notifications panel around it). Each page's frame answers the list's queries with these, filled or empty, so a
// screen's own samples never reach it.
import { provide } from 'vue';
import { createGraphQL } from './graphql';
import { NUXT_APP_KEY, useNuxtApp } from './nuxt-app';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const notification = (
  id: number,
  seen: boolean,
  minutes: number,
  type: string,
  objectType: string,
  objectId: number,
  title: string,
  message: string,
) => ({
  id: 8800 + id,
  seen,
  created_at: minutesAgo(minutes),
  notification: {
    id: 500 + id,
    object_id: objectId,
    object_type_id: objectType,
    notification_type_id: type,
    title,
    message,
    redirect_url: `/${objectType}s/${objectId}`,
    image_url: null,
  },
});

export const sampleNotifications = () => [
  notification(1, false, 4, 'newfeedbacktotaskupdate', 'task', 3101, 'New feedback on your task', 'Marco Lima left feedback on "Design your first level". Take a look and keep going!'),
  notification(2, false, 52, 'taskapproved', 'task', 3102, 'Task approved', 'Your task "Sketch the main character" was approved. You earned 50 XP.'),
  notification(3, false, 60 * 5, 'taskdeadline', 'task', 3103, 'Task due soon', '"Playtest with a friend" is due tomorrow.'),
  notification(4, true, 60 * 26, 'userjoinedproject', 'project', 412, 'New member', 'Ana Souza joined your project "Pixel Quest".'),
  notification(5, true, 60 * 24 * 3, 'projectnews', 'project', 412, 'Project news', 'Pixel Quest posted an update: the second world is ready to play.'),
  notification(6, true, 60 * 24 * 6, 'newtask', 'task', 3104, 'New task', 'A new task is waiting for you in "Intro to Game Design": "Make a paper prototype".'),
];

// Answers NOTIFICATIONS_LIST (and the seen mutation) for everything below the calling component. The list queries
// once per mount, so callers remount it when `empty` changes.
export function provideNotificationSamples(empty: () => boolean) {
  const notifications = sampleNotifications();
  const graphql = createGraphQL({
    NOTIFICATIONS_LIST: (variables) => {
      const limit = (variables.limit as number | undefined) ?? notifications.length;
      return { getUserNotifications: empty() ? [] : notifications.slice(0, limit) };
    },
    SET_NOTIFICATION_SEEN: () => ({ setUserNotificationSeen: true }),
  });
  provide(NUXT_APP_KEY, { ...useNuxtApp(), graphql, $graphqlRequest: graphql.request });
}
