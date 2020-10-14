import { join } from 'path'
import * as ejs from 'ejs'
import { Template, utils } from 'fbi'

import Factory from '..'

const { formatName, isValidObject } = utils

export default class TemplateAdmin extends Template {
  id = 'admin'
  description = 'template for admin application of @mrapi/dal'
  path = 'templates/admin'
  renderer = ejs.render
  templates = []

  constructor(public factory: Factory) {
    super()
  }

  protected async gathering() {
    this.data.project = await this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Input the project name',
        initial({ enquirer }: any) {
          return 'project-demo'
        },
        validate(value: any) {
          const name = formatName(value)
          return (name && true) || 'please input a valid project name'
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Input project description',
        initial({ state }: any) {
          return `${state.answers.name} description`
        }
      }
    ] as any)

    const { factory, project } = this.data
    project.features = []
    this.spinner = this.createSpinner(`Creating project...`).start(
      `Creating ${this.style.bold.green(project.name)} via ${factory.id} from ${
        factory.template
      }...`
    )
  }

  protected async writing() {
    // const { project } = this.data
    // if (project.features.vue) {
    this.files = {
      copy: [
        'config/*',
        'prisma/*',
        'scripts/*',
        'src/*',
        'view/*',
        '.gitignore',
        'README.md',
        'tsconfig.json'
      ],
      render: ['package.json', '.fbi.config.js', 'README.md'],
      renderOptions: {
        async: true
      }
    }
    // }
  }

  protected async installing(flags: Record<string, any>) {
    const { project } = this.data
    this.spinner.succeed(`Created project ${this.style.cyan.bold(project.name)}`)

    const { dependencies, devDependencies } = require(join(this.targetDir, 'package.json'))
    if (isValidObject(dependencies) || isValidObject(devDependencies)) {
      const installSpinner = this.createSpinner(`Installing dependencies...`).start()
      try {
        const packageManager = flags.packageManager || this.context.get('config').packageManager
        const cmds = packageManager === 'yarn' ? [packageManager] : [packageManager, 'install']
        this.debug(`\nrunning \`${cmds.join(' ')}\` in ${this.targetDir}`)
        await this.exec(cmds[0], cmds.slice(1), {
          cwd: this.targetDir
        })
        installSpinner.succeed(`Installed dependencies`)
      } catch (err) {
        installSpinner.fail('Failed to install dependencies. You can install them manually.')
        this.error(err)
      }
    }
  }

  protected async ending() {
    const { project } = this.data
    const projectName = this.style.cyan.bold(project.name)
    if (this.errors) {
      this.spinner.fail(`Failed to created project ${projectName}.`)
      this.error(this.errors)
    }

    console.log(`
Next steps:
  $ ${this.style.cyan('cd ' + project.name)}
  `)
    console.log(`
  $ ${this.style.cyan('npm run dev')} ${this.style.dim('launch the serve')}`)

    console.log(`
  $ ${this.style.cyan('npm run  build')} ${this.style.dim('build project')}`)

    //   console.log(`
    // $ ${this.style.cyan('fbi-next list')} ${this.style.dim(
    //     'show available commands and sub templates'
    //   )}`)
  }
}
