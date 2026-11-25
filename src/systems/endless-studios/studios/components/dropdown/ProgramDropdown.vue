<template>
  <div class="relative">
    <button
      id="program-drop-down"
      class="h-12 inline-flex items-center justify-center w-full rounded-xl border border-gray-300 shadow-xs px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-orange-endless"
      @click="isOpen = !isOpen"
    >
      {{ selectedOption ? selectedOption.label : $t('select_a_program') }}
      <svg
        class="-mr-1 ml-2 h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M6.293 6.707a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black/5"
    >
      <div
        class="py-1"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
        <span
          v-for="(option, index) in optionsList"
          :key="index"
          class="block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          role="menuitem"
          @click="selectOption(option)"
          >{{ option.label }}</span
        >
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-request'

const PROGRAM_DROPDOWN_GET_PAGES_AND_PROGRAMS_AND_PROJECTS_QUERY = gql`
  query PROGRAM_DROPDOWN_GET_PAGES_AND_PROGRAMS_AND_PROJECTS_QUERY {
    getPages(input: {}) {
      id
      name
      description
    }
    me {
      started_programs {
        team {
          program {
            name
            id
          }
        }
        individual {
          program {
            name
            id
          }
        }
      }
      memberOfProjects {
        id
        name
      }
    }
  }
`

export default {
  props: {
    defaultOption: {
      type: String,
      required: false,
      default: undefined,
    },
  },
  emits: ['programChange'],
  data() {
    return {
      isOpen: false,
      selectedOption: null,
      pagesList: [],
      programsList: [],
      projectsList: [],
    }
  },
  computed: {
    optionsList() {
      const pageOptions = this.pagesList.map((page) => ({
        label: page.description,
        value: page.id,
      }))

      const programOptions = this.programsList.map((program) => ({
        label: program.name,
        value: program.id,
      }))

      const projectOptions = this.projectsList.map((project) => ({
        label: project.name,
        value: project.id,
      }))

      return [...pageOptions, ...programOptions, ...projectOptions]
    },
  },
  watch: {
    optionsList(newOptionsList) {
      if (this.selectedOption !== null) return

      const option = newOptionsList.find(
        (currentOption) => currentOption.label === this.defaultOption,
      )
      if (option) {
        this.selectOption(option)
      }
    },
  },
  async mounted() {
    const response = await this.$graphqlRequest.query(
      PROGRAM_DROPDOWN_GET_PAGES_AND_PROGRAMS_AND_PROJECTS_QUERY,
    )
    this.pagesList = response?.data?.getPages ?? []
    this.programsList = [
      ...(response?.data?.me.started_programs.individual ?? []).map(
        (userProgram) => userProgram.program,
      ),
      ...(response?.data?.me.started_programs.team ?? []).map(
        (teamProgram) => teamProgram.program,
      ),
    ]
    this.projectsList = response?.data?.me.memberOfProjects ?? []
  },
  methods: {
    selectOption(option) {
      this.selectedOption = option
      this.$emit('programChange', this.selectedOption.value)
      this.isOpen = false
    },
  },
}
</script>
