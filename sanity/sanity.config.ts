'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { MarkShippedAction } from './actions/markShipped'
import { apiVersion, dataset, projectId } from './env'
import { schemaTypes, SINGLETONS } from './schemaTypes'
import { structure } from './structure'

/** Embedded Studio at /studio (PRD 8.1, 10). */
export default defineConfig({
  name: 'glint-and-thread',
  title: 'Glint & Thread',
  basePath: '/studio',
  projectId,
  dataset,
  // Token login keeps a user token in the client, used to authorise the "Mark as shipped" action.
  auth: { loginMethod: 'token' },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from the "new document" menu.
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    actions: (prev, context) => {
      if (SINGLETONS.includes(context.schemaType)) {
        return prev.filter(
          ({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action),
        )
      }
      if (context.schemaType === 'order')
        return [MarkShippedAction, ...prev.filter(({ action }) => action !== 'duplicate')]
      return prev
    },
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((t) => !SINGLETONS.includes(t.templateId) && t.templateId !== 'order')
        : prev,
  },
})
