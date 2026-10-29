/** @studio-id vwe1c0me00000001 */
/** @studio-state smbr000000000001 Member */
/** @studio-state snew000000000001 New user */
import { Link } from '@module/prototypes';

export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
];

export default function Welcome({ name }: { name?: string }) {
  return (
    <main>
      <h1>{name ? 'Welcome back, ' + name : 'Welcome'}</h1>
      <p>One screen, two named states.</p>
      <Link to="Details">Details</Link>
    </main>
  );
}
