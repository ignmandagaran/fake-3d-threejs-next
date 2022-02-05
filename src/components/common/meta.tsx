import { useRouter } from 'next/dist/client/router'
import NextHead from 'next/head'
import { NextSeo, NextSeoProps } from 'next-seo'
import * as React from 'react'

import { useMedia } from '~/hooks/use-media'
import { defaultMeta, siteOrigin } from '~/lib/constants'

type BasicMeta = {
  title?: string
  description?: string
  ogImage?: string
  noIndex?: boolean
  themeColor?: string
  preload?: { href: string; as: string }[]
  prefetch?: { href: string; as: string }[]
  colorScheme?: 'dark' | 'light'
}

export type MetaProps = BasicMeta & { rawNextSeoProps?: NextSeoProps }

export const Meta = (props: MetaProps) => {
  const router = useRouter()
  const isDark = useMedia('(prefers-color-scheme: dark)')

  const nextSeoProps: NextSeoProps = React.useMemo(() => {
    return {
      title: props.title ?? defaultMeta.title,
      description: props.description ?? defaultMeta.description,
      canonical: `${siteOrigin}${router.pathname}`,
      openGraph: {
        images: [
          {
            url: props.ogImage ?? defaultMeta.ogImage,
            alt: props.title ?? defaultMeta.title,
            width: 1200,
            height: 630
          }
        ]
      },
      twitter: {
        cardType: 'summary_large_image',
        handle: defaultMeta.twitter.handle,
        site: defaultMeta.twitter.site
      },
      noindex: props.noIndex,
      ...props.rawNextSeoProps
    }
  }, [props, router.pathname])

  return (
    <>
      <NextSeo {...nextSeoProps} />
      <NextHead>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          key="viewport"
          content="width=device-width, height=device-height, initial-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content={props.themeColor ?? '#000000'} />
        <link rel="icon" href={isDark ? '/favicon-dark.svg' : '/favicon.svg'} />
        <link rel="mask-icon" href="/favicon.svg" color="#000" />
        {props.preload?.map(({ href, as }) => (
          <link key={href} rel="preload" href={href} as={as} />
        ))}
        {props.prefetch?.map(({ href, as }) => (
          <link key={href} rel="prefetch" href={href} as={as} />
        ))}
      </NextHead>

      <style jsx global>{`
        html {
          color-scheme: ${props.colorScheme ?? 'light'};
        }
      `}</style>
    </>
  )
}
