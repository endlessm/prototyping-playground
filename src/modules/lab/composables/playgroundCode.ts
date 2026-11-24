import type { Ref } from 'vue'
import type { SourceFile } from '../../../../app/components/source/sourceAccess'

/**
 * What the code beside the stage needs, whether a version's draft
 * (`useVersionDraft`) or a read-only text such as an app component's
 * original (`useOriginalSource`).
 */
export interface PlaygroundCode {
  file: Readonly<Ref<SourceFile | undefined>>
  code: Ref<string>
  failure: Readonly<Ref<string | undefined>>
  saving: Readonly<Ref<boolean>>
  conflict: Readonly<Ref<boolean>>
  editable: Readonly<Ref<boolean>>
  unsaved: Readonly<Ref<boolean>>
  save: () => Promise<void>
  discard: () => Promise<void>
  keepMine: () => Promise<void>
  fileName: () => string
}
