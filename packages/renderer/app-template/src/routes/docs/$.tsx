import browserCollections from 'collections/browser'
import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { source } from '@/lib/source'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import { Suspense } from 'react'

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = (params._splat ?? '').split('/').filter(Boolean)
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
})

const serverLoader = createServerFn({ method: 'GET' })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()
    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={defaultMdxComponents} />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData())

  return (
    <DocsLayout
      tree={data.pageTree}
      nav={{ title: 'Peria Wiki' }}
      sidebar={{ enabled: true }}
    >
      <Suspense>{clientLoader.useContent(data.path, data)}</Suspense>
    </DocsLayout>
  )
}