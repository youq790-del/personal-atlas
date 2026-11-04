import { BackSide, Color, ShaderMaterial, Vector3 } from 'three';

// Original material system. Comic printing techniques were studied in Saeed
// Kolivand's portfolio; no shader code or artwork is copied from that project.
export function printMaterial(color: string, casework = false) {
  return new ShaderMaterial({
    name: 'yo7 printed colour',
    uniforms: {
      inkColor: { value: new Color('#171632') },
      plateColor: { value: new Color(color) },
      lightDirection: { value: new Vector3(-.45, .88, .3).normalize() },
      emphasis: { value: 0 },
      casework: { value: casework ? 1 : 0 },
    },
    vertexShader: `varying vec3 surfaceNormal; varying vec3 surfacePosition;
      varying vec3 worldNormal;
      void main(){
        surfacePosition=position; surfaceNormal=normal;
        worldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
    fragmentShader: `
      uniform vec3 plateColor; uniform vec3 inkColor; uniform vec3 lightDirection;
      uniform float emphasis; uniform float casework;
      varying vec3 surfaceNormal; varying vec3 surfacePosition; varying vec3 worldNormal;
      void main(){
        vec3 n=normalize(worldNormal);
        float lighting=dot(n,lightDirection);
        float lightBand=step(.3,lighting), highlight=step(.76,lighting);
        vec3 shadow=mix(inkColor,plateColor,.32);
        vec3 colour=mix(shadow,plateColor,lightBand);
        colour=mix(colour,mix(plateColor,vec3(1.),.055),highlight);
        // The shell is a paper-coloured top with solid indigo sidewalls.
        float wall=1.-step(.62,abs(normalize(surfaceNormal).y));
        colour=mix(colour,mix(inkColor,plateColor,.035),casework*wall);
        vec3 a=abs(surfaceNormal);
        vec2 sheet=a.y>a.x&&a.y>a.z?surfacePosition.xz:(a.x>a.z?surfacePosition.zy:surfacePosition.xy);
        // Patterns are locked to the material: they move with a rotating key.
        vec2 screen=mat2(.866,-.5,.5,.866)*sheet*34.;
        float distanceToDot=length(fract(screen)-.5);
        float aa=max(fwidth(distanceToDot),.015);
        float coverage=mix(.29,.11,lightBand);
        float dots=1.-smoothstep(coverage-aa,coverage+aa,distanceToDot);
        colour=mix(colour,inkColor,dots*mix(.6,.18,lightBand)*(1.-highlight*.7));
        float hatch=1.-smoothstep(.10,.10+fwidth(screen.x)*.7,abs(fract(screen.x*.6+screen.y*.6)-.5));
        colour=mix(colour,inkColor,hatch*(1.-lightBand)*.23);
        colour=mix(colour,vec3(1.,.94,.55),min(emphasis*.32,.18));
        gl_FragColor=vec4(colour,1.);
        #include <colorspace_fragment>
      }`,
  });
}

export function inkOutline() {
  return new ShaderMaterial({
    name: 'yo7 contour ink', side: BackSide,
    uniforms: { ink: { value: new Color('#171632') } },
    vertexShader: `void main(){
      vec4 p=modelViewMatrix*vec4(position,1.);
      vec3 n=normalize(normalMatrix*normal);
      // Constant view-space width keeps marks legible at the hero scale.
      p.xyz+=n*.032;
      gl_Position=projectionMatrix*p;
    }`,
    fragmentShader: `uniform vec3 ink; void main(){gl_FragColor=vec4(ink,1.); #include <colorspace_fragment>
}`.replace(' #include','\n#include'),
  });
}
