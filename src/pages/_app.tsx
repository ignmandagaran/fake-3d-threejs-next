import '~/css/global.css'

import { NextComponentType, NextPageContext } from 'next'
import { AppProps } from 'next/app'
import * as React from 'react'

import Inspect from '~/components/common/inspect'
import { AppContextProvider } from '~/context/app'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { basementLog, isDev, isProd } from '~/lib/constants'
import { useAppGA } from '~/lib/ga'

// TODO delete this basement log if not a basement project.
if (isProd) {
  // eslint-disable-next-line no-console
  console.log(basementLog)
}

export type Page<P = Record<string, unknown>> = NextComponentType<
  NextPageContext,
  Record<string, unknown>,
  P
> & { getLayout?: GetLayoutFn<P> }

export type GetLayoutFn<P = Record<string, unknown>> = (
  props: AppProps<P>
) => React.ReactNode

const App = ({ Component, pageProps, ...rest }: AppProps) => {
  useAppGA()

  if (isDev) {
    useMousetrap([
      {
        keys: ['command+i', 'ctrl+i', 'alt+i'],
        callback: () => document.body.classList.toggle('inspect')
      }
    ])
  }

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === `Tab`) {
        document.body.classList.add('user-is-tabbing')
      }
    }

    function handleMouseDown() {
      document.body.classList.remove('user-is-tabbing')
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const getLayout: GetLayoutFn =
    (Component as any).getLayout ||
    (({ Component, pageProps }) => <Component {...pageProps} />)

  return (
    <Inspect>
      <AppContextProvider>
        {getLayout({ Component, pageProps, ...rest })}
      </AppContextProvider>
    </Inspect>
  )
}

export default App
