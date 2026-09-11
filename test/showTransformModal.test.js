import assert from 'assert'
import './setup'
import { showTransformModal } from '../src/js/showTransformModal'
import { setLanguage, translate } from '../src/js/i18n'

describe('showTransformModal', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.querySelector('.pico-close').click()
    container.remove()
    setLanguage('en')
  })

  for (const language of ['en', 'fr-FR']) {
    it(`should associate the preview with its visible label in ${language}`, async () => {
      setLanguage(language)
      showTransformModal({
        container,
        json: [{ name: 'Alice' }],
        createQuery: () => '[*]',
        executeQuery: json => json,
        onTransform: () => {}
      })
      await new Promise(resolve => setTimeout(resolve, 350))

      const preview = container.querySelector('#preview')
      assert.strictEqual(preview.labels.length, 1)
      const label = preview.labels[0]
      assert.strictEqual(label.textContent.trim(), translate('transformPreviewLabel'))
      assert.strictEqual(label.control, preview)
      assert.strictEqual(preview.readOnly, true)
      assert.deepStrictEqual(JSON.parse(preview.value), [{ name: 'Alice' }])

      const click = new window.MouseEvent('click', { bubbles: true, cancelable: true })
      label.dispatchEvent(click)
      assert.strictEqual(click.defaultPrevented, false)
    })
  }
})
