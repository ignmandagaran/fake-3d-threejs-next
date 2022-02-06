import { useEffect, useRef } from 'react'

import { Meta } from '~/components/common/meta'
import { PageLayout } from '~/components/layout/page'

import Fake3DCanvas from '../lib/native-three/fake-3d'

const HomePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    new Fake3DCanvas({
      canvasRef: canvasRef.current
    })
  }, [])

  return (
    <PageLayout>
      <Meta />

      <canvas ref={canvasRef} className="webgl"></canvas>
    </PageLayout>
  )
}

export default HomePage
