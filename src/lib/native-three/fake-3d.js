/* eslint-disable */
import * as THREE from 'three'

// Main Settings

// Canvas

export default class EffectCanvas {
  constructor(options) {
    this.canvasRef = options.canvasRef

    this.update = this.update.bind(this)

    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    this.originalImageDetails = {
      width: 0,
      height: 0,
      aspectRatio: 0
    }
    this.settings = {
      xThreshold: 20,
      yThreshold: 35,
      originalImagePath: '/office.png',
      depthImagePath: '/office-depth-map.png'
    }

    this.aspectRatio = this.viewport.width / this.viewport.height
    this.planeGeometry = null
    this.planeMaterial = null
    this.plane = null
    this.textureLoader = new THREE.TextureLoader()
    this.clock = new THREE.Clock()
    this.previousTime = 0

    this.originalImage = null
    this.depthImage = null

    this.cursor = {
      x: 0,
      y: 0,
      lerpX: 0,
      lerpY: 0
    }

    this.init()
  }

  init() {
    this.addCanvas()
    this.addScene()
    this.addCamera()
    this.loadImages()
    this.create3dImage()
    this.addEventListeners()
    this.onResize()
    this.update()
  }

  addCanvas() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef
    })
  }

  addScene() {
    this.scene = new THREE.Scene()
  }

  addCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.viewport.width / this.viewport.height,
      0.1,
      100
    )
    this.camera.position.x = 0
    this.camera.position.y = 0
    this.camera.position.z = 0.7
    this.fovY =
      (this.camera.position.z * this.camera.getFilmHeight()) /
      this.camera.getFocalLength()

    this.scene.add(this.camera)
  }

  addEventListeners() {
    window.addEventListener('mousemove', (event) => {
      this.cursor.x = event.clientX / this.viewport.width - 0.5
      this.cursor.y = event.clientY / this.viewport.height - 0.5
    })

    window.addEventListener('mouseout', (event) => {
      this.cursor.x = 0
      this.cursor.y = 0
    })
    window.addEventListener('touchmove', (event) => {
      const touch = event.touches[0]
      this.cursor.x = touch.pageX / this.viewport.width - 0.5
      this.cursor.y = touch.pageY / this.viewport.height - 0.5
    })

    window.addEventListener('touchend', (event) => {
      this.cursor.x = 0
      this.cursor.y = 0
    })

    window.addEventListener('resize', () => {
      this.onResize()
    })
  }

  onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.left = -1 * this.aspectRatio
    this.camera.right = 1 * this.aspectRatio
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    if (
      this.viewport.height / this.viewport.width <
      this.originalImageDetails.aspectRatio
    ) {
      this.plane.scale.set(
        this.fovY * this.camera.aspect,
        (this.viewport.width / this.viewport.height) *
          this.originalImageDetails.aspectRatio,
        1
      )
    } else {
      this.plane.scale.set(
        this.fovY / this.originalImageDetails.aspectRatio,
        this.fovY,
        1
      )
    }
  }

  loadImages = () => {
    if (this.originalImage !== null || this.depthImage !== null) {
      this.originalImage.dispose()
      this.depthImage.dispose()
    }
    this.depthImage = this.textureLoader.load(this.settings.depthImagePath)

    this.originalImage = this.textureLoader.load(
      this.settings.originalImagePath,
      (tex) => {
        this.originalImageDetails.width = tex.image.width
        this.originalImageDetails.height = tex.image.height
        this.originalImageDetails.aspectRatio =
          tex.image.height / tex.image.width

        this.create3dImage()
        this.onResize()
      }
    )
  }

  create3dImage = () => {
    // Cleanup Geometry for GUI
    if (this.plane !== null) {
      this.planeGeometry.dispose()
      this.planeMaterial.dispose()
      this.scene.remove(this.plane)
    }

    this.planeGeometry = new THREE.PlaneBufferGeometry(1, 1)

    this.planeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        originalTexture: { value: this.originalImage },
        depthTexture: { value: this.depthImage },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uThreshold: {
          value: new THREE.Vector2(
            this.settings.xThreshold,
            this.settings.yThreshold
          )
        }
      },
      fragmentShader: `
          precision mediump float;
          uniform sampler2D originalTexture; 
          uniform sampler2D depthTexture; 
          uniform vec2 uMouse;
          uniform vec2 uThreshold;
    
          varying vec2 vUv;
    
          vec2 mirrored(vec2 v) {
            vec2 m = mod(v,2.);
            return mix(m,2.0 - m, step(1.0 ,m));
          }
    
          void main() {
            vec4 depthMap = texture2D(depthTexture, mirrored(vUv));
            vec2 fake3d = vec2(vUv.x + (depthMap.r - 0.5) * uMouse.x / uThreshold.x, vUv.y + (depthMap.r - 0.5) * uMouse.y / uThreshold.y);
    
            gl_FragColor = texture2D(originalTexture,mirrored(fake3d));
          }
        `,
      vertexShader: `
          varying vec2 vUv; 
    
          void main() {
            vUv = uv; 
    
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
          }
        `
    })

    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial)

    this.scene.add(this.plane)
  }

  update = () => {
    this.elapsedTime = this.clock.getElapsedTime()
    this.deltaTime = this.elapsedTime - this.previousTime
    this.previousTime = this.elapsedTime

    // Set Cursor Variables
    const parallaxX = this.cursor.x * 0.5
    const parallaxY = -this.cursor.y * 0.5

    this.cursor.lerpX += (parallaxX - this.cursor.lerpX) * 5 * this.deltaTime
    this.cursor.lerpY += (parallaxY - this.cursor.lerpY) * 5 * this.deltaTime

    // Mouse Positioning Uniform Values
    this.planeMaterial.uniforms.uMouse.value = new THREE.Vector2(
      this.cursor.lerpX,
      this.cursor.lerpY
    )

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(this.update)
  }
}
