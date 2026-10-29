/** @studio-id vdashbard0000001 */
/** @studio-state sspan00000000001 Spanish learner */
/** @studio-state ssgnd00000000001 Signed out */
/** @studio-state snevents00000001 No events */
import { VueScreen } from '@/systems/endless-studios/libraries/vue';
import Dashboard from './_vue/Dashboard.vue';

// The parity harness copies the new studio's Dashboard.vue into _vue/. There its options are `export const system`
// and each state's `system`; here they are VueScreen's props, defined outside the view so screens aren't rebuilt.
const events = {
  queries: {
    UpcomingEventInstances: {
      upcomingEventInstances: [{ id: 1, title: 'Game jam kickoff', start: '2026-11-04T15:00:00Z', event: { id: 9 } }],
    },
  },
};
const noEvents = {};

export const states = [
  { title: 'Spanish learner', props: { locale: 'es', user: 'learner' } },
  { title: 'Signed out', props: { user: null } },
  { title: 'No events', props: { sample: noEvents } },
];

type Props = { locale?: string; user?: 'learner' | 'mentor' | 'admin' | null; sample?: object };

export default function DashboardView({ locale = 'en', user = 'admin', sample = events }: Props) {
  return <VueScreen component={Dashboard} locale={locale} user={user} sample={sample} />;
}
