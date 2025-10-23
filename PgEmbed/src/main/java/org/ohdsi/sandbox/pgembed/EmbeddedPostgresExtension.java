package org.ohdsi.sandbox.pgembed;

import org.junit.jupiter.api.extension.*;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Optional;

public class EmbeddedPostgresExtension implements BeforeAllCallback, AfterAllCallback, ParameterResolver {

	/**
	 * This is an inner class annotation because it only applies to the
	 * EmbeddedPostgressExtension. We use it when we want to assign a port to the
	 * embedded postgres instance.
	 */
	@Target(ElementType.TYPE)
	@Retention(RetentionPolicy.RUNTIME)
	@ExtendWith(EmbeddedPostgresExtension.class)
	public @interface WithEmbeddedPostgres {
		int port() default -1;
		int timeoutSeconds() default -1;
	}

	private static EmbeddedPostgres postgres;

	public static EmbeddedPostgres getInstance() {
		return postgres;
	}

	@Override
	public void beforeAll(ExtensionContext context) throws Exception {

		WithEmbeddedPostgres config = context.getRequiredTestClass().getAnnotation(WithEmbeddedPostgres.class);
		PGFactory.Options options = new PGFactory.Options();
		if (config != null) {
			if (config.port() != -1)
				options.port = Optional.of(config.port());
			if (config.timeoutSeconds() != -1)
				options.timeoutSeconds = Optional.of(config.timeoutSeconds());
		}
		postgres = PGFactory.createEmbeddedPostgres(options);
		getStore(context).put("postgres", postgres);
	}

	@Override
	public void afterAll(ExtensionContext context) throws Exception {
		EmbeddedPostgres pg = getStore(context).remove("postgres", EmbeddedPostgres.class);
		if (pg != null) {
			pg.close();
		}
		postgres = null;
	}

	@Override
	public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
		return parameterContext.getParameter().getType().equals(EmbeddedPostgres.class);
	}

	@Override
	public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
		return getStore(extensionContext).get("postgres", EmbeddedPostgres.class);
	}

	private ExtensionContext.Store getStore(ExtensionContext context) {
		return context.getStore(ExtensionContext.Namespace.create(getClass(), context.getRequiredTestClass()));
	}
}
