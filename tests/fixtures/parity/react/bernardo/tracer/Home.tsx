/** @studio-id vhme000000000001 */
import { VueScreen } from '@/systems/endless-studios/libraries/vue';
import Home from './_vue/Home.vue';

// The parity harness copies the new studio's Home.vue into _vue/, so both studios render the same screen.
export default function HomeView() {
  return <VueScreen component={Home} />;
}
